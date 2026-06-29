import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  addSuperAdmin,
  fetchSuperAdmins,
  removeSuperAdmin,
} from '@/lib/admin-api';
import type { AdminSuperAdmin } from '@/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Shield, Trash2, UserPlus } from 'lucide-react';

export default function AdminSuperAdminsPage() {
  const [admins, setAdmins] = useState<AdminSuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuperAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    try {
      await addSuperAdmin({ email: email.trim() });
      toast.success('Super admin added');
      setEmail('');
      await loadAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (admin: AdminSuperAdmin) => {
    if (
      !confirm(
        `Remove admin access for ${admin.username}? They will lose access to the admin panel.`,
      )
    ) {
      return;
    }

    try {
      await removeSuperAdmin(admin.userId);
      toast.success(`Removed admin access for ${admin.username}`);
      await loadAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Super Admins
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage who can access the platform admin panel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Super Admin
          </CardTitle>
          <CardDescription>
            Enter the email of an existing registered user to grant admin access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="flex-1 space-y-2">
              <Label htmlFor="admin-email">User email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="user@auditijt.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={adding || !email.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Admin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Admins ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.userId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {admin.username}
                        {admin.isSelf && <Badge variant="secondary">You</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {admin.createdAt
                        ? format(parseISO(admin.createdAt), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link to={`/admin/users/${admin.userId}`} />}
                      >
                        View user
                      </Button>
                      {!admin.isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemove(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
