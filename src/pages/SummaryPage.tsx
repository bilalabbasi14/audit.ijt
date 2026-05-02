import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { MonthlySummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/session';
import MonthSelector from '@/components/shared/MonthSelector';
import { recalculateMonthlySummary } from '@/utils/summary';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

export default function SummaryPage() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchSummary = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('org_id', organization.id)
        .eq('month', selectedMonth)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setSummary(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [organization, selectedMonth]);

  const handleRecalculate = async () => {
    if (!organization) return;
    setRecalculating(true);
    try {
      await recalculateMonthlySummary(organization.id, selectedMonth);
      toast.success('Summary recalculated');
      fetchSummary();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monthly Summary</h1>
          <div className="mt-2 flex items-center gap-4">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRecalculate} 
              disabled={recalculating}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", recalculating && "animate-spin")} />
              Recalculate
            </Button>
          </div>
        </div>
      </div>

      {!summary && !loading ? (
        <Card className="p-12 text-center">
          <CardHeader>
            <CardTitle>No summary found for this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground max-w-md mx-auto">
              A summary row is automatically created when you add income or expense entries. 
              If you just changed something, click recalculate.
            </p>
            <Button onClick={handleRecalculate} disabled={recalculating}>
              Initialize Summary
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="md:col-span-1 shadow-lg border-2">
            <CardHeader className="bg-muted/30 pb-6">
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Statement
                <Badge variant={summary?.is_deficit ? 'destructive' : 'default'} className="px-3 py-1">
                  {summary?.is_deficit ? 'Deficit' : 'Surplus'}
                </Badge>
              </div>
              <CardTitle className="text-2xl mt-4">
                {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                    <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Last Month Balance</span>
                </div>
                <span className="font-mono font-bold">{formatCurrency(summary?.last_month_balance || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Total Income</span>
                </div>
                <span className="font-mono font-bold text-green-600">+{formatCurrency(summary?.total_income || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span>Total Expenses</span>
                </div>
                <span className="font-mono font-bold text-red-600">-{formatCurrency(summary?.total_expenses || 0)}</span>
              </div>

              <div className="border-t-2 pt-6 flex justify-between items-center">
                <span className="text-xl font-black">Closing Balance</span>
                <span className={cn(
                  "text-2xl font-black font-mono underline decoration-2 underline-offset-4",
                  summary?.is_deficit ? "text-destructive" : "text-primary"
                )}>
                  {formatCurrency(summary?.closing_balance || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              Income Highlights
              <ArrowRight className="h-4 w-4" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniCard title="Amoomi Received" value={summary?.total_amoomi_income || 0} />
              <MiniCard title="Amoomi Expected" value={summary?.total_expected_amoomi || 0} />
              <MiniCard title="Khasoosi Total" value={summary?.total_khasoosi_income || 0} />
              <MiniCard 
                title="Amoomi Gap" 
                value={(summary?.total_expected_amoomi || 0) - (summary?.total_amoomi_income || 0)} 
                highlight={((summary?.total_expected_amoomi || 0) - (summary?.total_amoomi_income || 0)) > 0}
              />
            </div>
            
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
              <h4 className="text-sm font-bold mb-2 italic">Note on Carry-forward</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If the previous month closed with a deficit (negative balance), the carry-forward for the current month is set to 0. 
                Deficits do not accumulate across months in this auditor system. Surpluses are fully carried forward.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ title, value, highlight }: { title: string, value: number, highlight?: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card",
      highlight && "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
    )}>
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{title}</p>
      <p className="text-lg font-mono font-bold">{formatCurrency(value)}</p>
    </div>
  );
}

