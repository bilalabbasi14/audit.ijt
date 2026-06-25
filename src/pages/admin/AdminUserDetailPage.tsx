import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAdminUserDetail } from '@/lib/admin-api';
import type { AdminUserDetail } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog';
import { formatCurrency } from '@/utils/session';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
} from 'lucide-react';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAdminUserDetail(id)
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-destructive">{error ?? 'User not found'}</p>
        <Button variant="outline" render={<Link to="/admin/users" />}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const currency = user.organization?.currencySymbol ?? 'Rs';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" render={<Link to="/admin/users" />} className="mb-2 gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user.organization?.name ?? 'No organization'}
          </p>
        </div>
        <ResetPasswordDialog userId={user.id} username={user.username} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-28">Username</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-28">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-28">Created</span>
              <span>
                {user.createdAt ? format(parseISO(user.createdAt), 'MMMM d, yyyy') : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-28">Last Login</span>
              <span>
                {user.lastSignInAt
                  ? format(parseISO(user.lastSignInAt), 'MMMM d, yyyy h:mm a')
                  : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {user.organization ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{user.organization.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{user.organization.currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {format(parseISO(user.organization.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No organization record found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {user.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Muawineen</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {user.stats.muawineenCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Income</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {formatCurrency(user.stats.totalIncome, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                {formatCurrency(user.stats.totalExpenses, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Latest Balance</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {user.stats.latestClosingBalance != null
                  ? formatCurrency(user.stats.latestClosingBalance, currency)
                  : '—'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {user.monthlySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summaries</CardTitle>
            <CardDescription>Recent financial periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.monthlySummaries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.month}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(s.total_income, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(s.total_expenses, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(s.closing_balance, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentIncome.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income entries</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.recentIncome.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="capitalize">{entry.type}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense entries</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.recentExpenses.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {entry.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
