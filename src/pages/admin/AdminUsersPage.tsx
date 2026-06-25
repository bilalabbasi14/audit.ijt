import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminUsers } from '@/lib/admin-api';
import type { AdminUserSummary } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/session';
import { format, parseISO } from 'date-fns';
import { Users, Search, Loader2, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminUsers()
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.organization?.name.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          All Users
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {users.length} registered organization{users.length !== 1 ? 's' : ''} on the platform.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Search by username, email, or organization name</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.organization?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastSignInAt
                        ? format(parseISO(user.lastSignInAt), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {user.stats?.latestClosingBalance != null
                        ? formatCurrency(
                            user.stats.latestClosingBalance,
                            user.organization?.currencySymbol ?? 'Rs'
                          )
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" render={<Link to={`/admin/users/${user.id}`} />} className="gap-1">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
