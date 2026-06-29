import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchAdminMonthlyFinances } from '@/lib/admin-api';
import type { AdminMonthlyFinancesReport } from '@/types/admin';
import MonthSelector from '@/components/shared/MonthSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/session';
import { Loader2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

type AdminUserMonthlyFinancesSectionProps = {
  userId: string;
  currency: string;
};

export function AdminUserMonthlyFinancesSection({
  userId,
  currency,
}: AdminUserMonthlyFinancesSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [report, setReport] = useState<AdminMonthlyFinancesReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminMonthlyFinances(userId, selectedMonth);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');
  const summary = report?.summary;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Monthly Income &amp; Expenses
            </CardTitle>
            <CardDescription>Income and expense entries for the selected month</CardDescription>
          </div>
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Month</p>
                <p className="font-semibold">{monthLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  Total Income
                </p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(summary?.totalIncome ?? 0, currency)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  Total Expenses
                </p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(summary?.totalExpenses ?? 0, currency)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Closing Balance</p>
                <p className="font-semibold">
                  {summary?.closingBalance != null
                    ? formatCurrency(summary.closingBalance, currency)
                    : '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Income ({report.income.length})</h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Muawin</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.income.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No income this month
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.income.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell className="font-medium">{entry.muawinName}</TableCell>
                            <TableCell className="capitalize">{entry.type}</TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(entry.amount, currency)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Expenses ({report.expenses.length})</h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No expenses this month
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.expenses.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.categoryName}</TableCell>
                            <TableCell className="truncate max-w-[120px]">
                              {entry.description ?? '—'}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              {formatCurrency(entry.amount, currency)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Could not load finances for {monthLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
