import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { IncomeEntry, ExpenseEntry, MonthlySummary, Muawin, ExpenseCategory } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { formatCurrency, getMonthList, getCurrentSessionYear } from '@/utils/session';
import MonthSelector from '@/components/shared/MonthSelector';
import { FileDown, Printer, Loader2 } from 'lucide-react';
import { generatePDF } from '@/utils/pdf';
import { toast } from 'sonner';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function ReportsPage() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [sessionYear, setSessionYear] = useState(getCurrentSessionYear());

  const handleMonthlyReport = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      // Fetch everything for the month
      const [incomeRes, expenseRes, summaryRes, muawinRes, catRes] = await Promise.all([
        supabase.from('income_entries').select('*').eq('org_id', organization.id).eq('month', selectedMonth),
        supabase.from('expense_entries').select('*').eq('org_id', organization.id).eq('month', selectedMonth),
        supabase.from('monthly_summaries').select('*').eq('org_id', organization.id).eq('month', selectedMonth).single(),
        supabase.from('muawineen').select('*').eq('org_id', organization.id),
        supabase.from('expense_categories').select('*').eq('org_id', organization.id)
      ]);

      const incomes = incomeRes.data || [];
      const expenses = expenseRes.data || [];
      const summary = summaryRes.data;
      const muawineen = muawinRes.data || [];
      const categories = catRes.data || [];

      // Sections
      const incomeRows = incomes.map(i => [
        format(parseISO(i.date), 'dd/MM/yyyy'),
        `${muawineen.find(m => m.id === i.muawin_id)?.name || 'Unknown'}`,
        i.type.toUpperCase(),
        i.type === 'khasoosi' ? (i.khasoosi_purpose || '-') : (i.notes || '-'),
        `+${i.amount.toFixed(2)}`
      ]);

      const expenseRows = expenses.map(e => [
        format(parseISO(e.date), 'dd/MM/yyyy'),
        categories.find(c => c.id === e.category_id)?.name || 'Unknown',
        e.description || '-',
        `-${e.amount.toFixed(2)}`
      ]);

      // Summaries
      const amoomiReceived = incomes.filter(i => i.type === 'amoomi').reduce((sum, i) => sum + Number(i.amount), 0);
      const khasoosiReceived = incomes.filter(i => i.type === 'khasoosi').reduce((sum, i) => sum + Number(i.amount), 0);
      const expectedAmoomi = muawineen.reduce((sum, m) => sum + (m.category !== 'khasoosi' ? Number(m.amoomi_committed_amount || 0) : 0), 0);
      
      const incomeSummaryRows: [string, string][] = [
        ['Expected Amoomi (Regular)', formatCurrency(expectedAmoomi)],
        ['Actual Amoomi Received', formatCurrency(amoomiReceived)],
        ['Amoomi Gap / Deficit', formatCurrency(Math.max(0, expectedAmoomi - amoomiReceived))],
        ['Khasoosi (Special) Received', formatCurrency(khasoosiReceived)],
        ['TOTAL INCOME RECEIVED', formatCurrency(summary?.total_income || 0)]
      ];

      const expenseCategoryBreakdown = categories.map(cat => {
        const total = expenses.filter(e => e.category_id === cat.id).reduce((sum, e) => sum + Number(e.amount), 0);
        return { name: cat.name, total };
      }).filter(c => c.total > 0);

      const expenseSummaryRows: [string, string][] = [
        ...expenseCategoryBreakdown.map(c => [c.name, formatCurrency(c.total)] as [string, string]),
        ['TOTAL EXPENSES INCURRED', formatCurrency(summary?.total_expenses || 0)]
      ];

      const overallSummaryRows: [string, string][] = [
        ['Opening Balance (Last Month)', formatCurrency(summary?.last_month_balance || 0)],
        ['Current Month Income (+)', formatCurrency(summary?.total_income || 0)],
        ['Current Month Expenses (-)', formatCurrency(summary?.total_expenses || 0)],
        ['CLOSING BALANCE / NET POSITION', formatCurrency(summary?.closing_balance || 0)]
      ];

      generatePDF({
        title: `Monthly Audit Report - ${format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}`,
        organizationName: organization.name,
        dateRange: format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy'),
        sections: [
          {
            title: 'Income Details',
            headers: ['Date', 'Muawin (Donor)', 'Type', 'Purpose/Notes', 'Amount'],
            rows: incomeRows
          },
          {
            title: 'Expense Details',
            headers: ['Date', 'Category', 'Description', 'Amount'],
            rows: expenseRows
          }
        ],
        summaries: [
          { title: 'Income Summary', rows: incomeSummaryRows },
          { title: 'Expense Summary', rows: expenseSummaryRows },
          { title: 'Overall Financial Position', rows: overallSummaryRows }
        ]
      });
      toast.success('Report generated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodReport = async (monthsCount: number, label: string) => {
    if (!organization) return;
    setLoading(true);
    try {
      const monthList = getMonthList(sessionYear).slice(0, monthsCount);
      const monthValues = monthList.map(m => m.value);

      const { data: summaries } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('org_id', organization.id)
        .in('month', monthValues)
        .order('month');

      const totals = summaries?.reduce((acc, s) => ({
        income: acc.income + Number(s.total_income),
        expenses: acc.expenses + Number(s.total_expenses)
      }), { income: 0, expenses: 0 });

      const finalBalance = summaries?.[summaries.length - 1]?.closing_balance || 0;

      generatePDF({
        title: `${label} - Session ${sessionYear}`,
        organizationName: organization.name,
        dateRange: `${monthList[0].label} to ${monthList[monthList.length - 1].label}`,
        sections: [
          {
            title: 'Monthly Overview',
            headers: ['Month', 'Income (+)', 'Expenses (-)', 'Balance', 'Status'],
            rows: monthList.map(m => {
              const s = summaries?.find(x => x.month === m.value);
              return [
                m.label,
                formatCurrency(s?.total_income || 0),
                formatCurrency(s?.total_expenses || 0),
                formatCurrency(s?.closing_balance || 0),
                s?.is_deficit ? 'DEFICIT' : 'SURPLUS'
              ];
            })
          }
        ],
        summaries: [
          {
            title: 'Period Summary',
            rows: [
              [`Total Income Received`, formatCurrency(totals?.income || 0)],
              [`Total Expenses Incurred`, formatCurrency(totals?.expenses || 0)],
              [`Net Position / Final Balance`, formatCurrency(finalBalance)]
            ]
          }
        ]
      });
      toast.success('Report generated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audit Reports</h1>
        <p className="text-muted-foreground">Select a report type to generate and download a PDF statement.</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="half-yearly">6-Month Report</TabsTrigger>
          <TabsTrigger value="session">Session Report</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="monthly">
            <ReportCard 
              title="Individual Monthly Report" 
              description="Full breakdown of all income and expenses for a specific month."
              icon={<FileDown className="h-10 w-10 text-primary/40" />}
            >
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">Select Month</p>
                  <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
                </div>
                <Button onClick={handleMonthlyReport} disabled={loading} className="gap-2 shrink-0">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Printer className="h-4 w-4" />}
                  Generate PDF
                </Button>
              </div>
            </ReportCard>
          </TabsContent>

          <TabsContent value="half-yearly">
            <ReportCard 
              title="6-Month Summary Report" 
              description="Consolidated overview of the first 6 months (February to July)."
              icon={<FileDown className="h-10 w-10 text-primary/40" />}
            >
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">Session Year</p>
                  <Select value={sessionYear.toString()} onValueChange={(val) => setSessionYear(parseInt(val))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map(i => {
                        const y = getCurrentSessionYear() - i;
                        return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handlePeriodReport(6, '6-Month Summary')} disabled={loading} className="gap-2 shrink-0">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Printer className="h-4 w-4" />}
                  Generate PDF
                </Button>
              </div>
            </ReportCard>
          </TabsContent>

          <TabsContent value="session">
            <ReportCard 
              title="Full Session Report" 
              description="Complete 12-month audit for the entire organizational session (Feb to Jan)."
              icon={<FileDown className="h-10 w-10 text-primary/40" />}
            >
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">Session Year</p>
                  <Select value={sessionYear.toString()} onValueChange={(val) => setSessionYear(parseInt(val))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map(i => {
                        const y = getCurrentSessionYear() - i;
                        return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handlePeriodReport(12, 'Full Session Report')} disabled={loading} className="gap-2 shrink-0">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Printer className="h-4 w-4" />}
                  Generate PDF
                </Button>
              </div>
            </ReportCard>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ReportCard({ title, description, children, icon }: any) {
  return (
    <Card className="max-w-2xl mx-auto overflow-hidden border-2">
      <div className="flex">
        <div className="hidden sm:flex items-center justify-center p-8 bg-muted">
          {icon}
        </div>
        <div className="flex-1 p-6 sm:p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {children}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
