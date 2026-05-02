import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { ExpenseCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Settings, Building, Wallet, Lock, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { organization, refreshOrg } = useOrganization();
  const { user } = useAuth();
  
  const [orgName, setOrgName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('Rs');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setCurrencySymbol(organization.currency_symbol);
      fetchCategories();
    }
  }, [organization]);

  const fetchCategories = async () => {
    if (!organization) return;
    setCatLoading(true);
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('org_id', organization.id)
      .order('name');
    setCategories(data || []);
    setCatLoading(false);
  };

  const handleUpdateOrg = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName, currency_symbol: currencySymbol })
        .eq('id', organization.id);
      
      if (error) throw error;
      toast.success('Organization settings updated');
      refreshOrg();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? It will fail if used in expenses.')) return;
    try {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error('Could not delete category. It might be in use.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your organization identity, categories, and security.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Profile
            </CardTitle>
            <CardDescription>Update your organization's display name and preferred currency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input 
                  id="orgName" 
                  value={orgName} 
                  onChange={e => setOrgName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Symbol</Label>
                <Input 
                  id="currency" 
                  value={currencySymbol} 
                  onChange={e => setCurrencySymbol(e.target.value)} 
                  placeholder="Rs, $, etc."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t py-3">
            <Button onClick={handleUpdateOrg} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Expense Categories
                </CardTitle>
                <CardDescription>Define custom categories for your organizational spending.</CardDescription>
              </div>
              <CategoryAddDialog fetchCategories={fetchCategories} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">Loading categories...</TableCell>
                  </TableRow>
                ) : (
                  categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold uppercase">
                          {cat.is_default ? 'Default' : 'Custom'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!cat.is_default && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-8 w-8"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Update your management account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Min 6 characters"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t py-3">
            <Button variant="destructive" onClick={handleUpdatePassword} disabled={loading || !newPassword}>
              Update Password
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function CategoryAddDialog({ fetchCategories }: { fetchCategories: () => void }) {
  const { organization } = useOrganization();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAdd = async () => {
    if (!organization || !name) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert({ org_id: organization.id, name });
      if (error) throw error;
      toast.success('Category added');
      setName('');
      setOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Category
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Utility Bills" />
          </div>
          <Button onClick={handleAdd} className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Add Category'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
