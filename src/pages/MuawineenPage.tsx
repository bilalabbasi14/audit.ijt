import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { Muawin, IncomeEntry } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentSessionYear, getMonthList, formatCurrency } from '@/utils/session';

export default function MuawineenPage() {
  const { organization } = useOrganization();
  const [muawineen, setMuawineen] = useState<Muawin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'amoomi' | 'khasoosi' | 'both'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMuawin, setEditingMuawin] = useState<Muawin | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'amoomi' as 'amoomi' | 'khasoosi' | 'both',
    amoomi_committed_amount: '',
    contact_number: '',
    address: '',
    detail: ''
  });

  const fetchMuawineen = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muawineen')
        .select('*')
        .eq('org_id', organization.id)
        .order('name');
      
      if (error) throw error;
      setMuawineen(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuawineen();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    const muawinData = {
      org_id: organization.id,
      name: formData.name,
      category: formData.category,
      amoomi_committed_amount: formData.category !== 'khasoosi' ? parseFloat(formData.amoomi_committed_amount) || 0 : 0,
      contact_number: formData.contact_number || null,
      address: formData.address || null,
      detail: formData.detail || null,
    };

    try {
      if (editingMuawin) {
        const { error } = await supabase
          .from('muawineen')
          .update(muawinData)
          .eq('id', editingMuawin.id);
        if (error) throw error;
        toast.success('Muawin updated successfully');
      } else {
        const { error } = await supabase
          .from('muawineen')
          .insert(muawinData);
        if (error) throw error;
        toast.success('Muawin added successfully');
      }
      setIsDialogOpen(false);
      setEditingMuawin(null);
      resetForm();
      fetchMuawineen();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'amoomi',
      amoomi_committed_amount: '',
      contact_number: '',
      address: '',
      detail: ''
    });
  };

  const handleEdit = (m: Muawin) => {
    setEditingMuawin(m);
    setFormData({
      name: m.name,
      category: m.category,
      amoomi_committed_amount: m.amoomi_committed_amount?.toString() || '',
      contact_number: m.contact_number || '',
      address: m.address || '',
      detail: m.detail || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this muawin? This will fail if they have income records.')) return;
    try {
      const { error } = await supabase.from('muawineen').delete().eq('id', id);
      if (error) throw error;
      toast.success('Muawin deleted');
      fetchMuawineen();
    } catch (err: any) {
      toast.error('Could not delete muawin. Check for existing income entries.');
    }
  };

  const filteredMuawineen = muawineen.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Muawineen</h1>
          <p className="text-muted-foreground">Manage your organization's donors and tracking</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingMuawin(null); resetForm(); }
        }}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" />
            Add Muawin
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingMuawin ? 'Edit Muawin' : 'Add New Muawin'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val: any) => setFormData({...formData, category: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amoomi">Amoomi (Regular)</SelectItem>
                    <SelectItem value="khasoosi">Khasoosi (Special Purpose)</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.category === 'amoomi' || formData.category === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Committed Monthly Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={formData.amoomi_committed_amount} 
                    onChange={e => setFormData({...formData, amoomi_committed_amount: e.target.value})} 
                    required 
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input 
                  id="contact" 
                  value={formData.contact_number} 
                  onChange={e => setFormData({...formData, contact_number: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail">Details / Notes</Label>
                <Textarea 
                  id="detail" 
                  value={formData.detail} 
                  onChange={e => setFormData({...formData, detail: e.target.value})} 
                />
              </div>
              <DialogFooter>
                <Button type="submit">{editingMuawin ? 'Update' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="list">Muawineen List</TabsTrigger>
          <TabsTrigger value="status">Amoomi Status Grid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={(val: any) => setCategoryFilter(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="amoomi">Amoomi</SelectItem>
                    <SelectItem value="khasoosi">Khasoosi</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Committed</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="hidden md:table-cell">Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                      </TableRow>
                    ) : filteredMuawineen.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No donors found</TableCell>
                      </TableRow>
                    ) : (
                      filteredMuawineen.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>
                            <Badge variant={m.category === 'amoomi' ? 'default' : m.category === 'khasoosi' ? 'secondary' : 'outline'}>
                              {m.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {m.category !== 'khasoosi' ? formatCurrency(m.amoomi_committed_amount || 0) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{m.contact_number || '-'}</TableCell>
                          <TableCell className="text-sm hidden md:table-cell">{m.address || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(m.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status" className="pt-4">
          <AmoomiStatusGrid muawineen={muawineen} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AmoomiStatusGrid({ muawineen }: { muawineen: Muawin[] }) {
  const { organization } = useOrganization();
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionYear = getCurrentSessionYear();
  const months = getMonthList(sessionYear);
  const amoomiMuawineen = muawineen.filter(m => m.category === 'amoomi' || m.category === 'both');

  useEffect(() => {
    const fetchIncome = async () => {
      if (!organization) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('income_entries')
          .select('*')
          .eq('org_id', organization.id);
        if (error) throw error;
        setIncomes(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncome();
  }, [organization]);

  const getStatus = (muawinId: string, month: string, committed: number) => {
    const monthIncomes = incomes.filter(i => i.muawin_id === muawinId && i.month === month);
    const totalPaid = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

    if (totalPaid <= 0) return { icon: <XCircle className="h-4 w-4 text-destructive" />, label: 'Unpaid' };
    
    // If committed amount is 0, any amount means Paid
    if (committed <= 0 && totalPaid > 0) return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Paid' };
    
    if (totalPaid >= committed) return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Paid' };
    return { icon: <AlertCircle className="h-4 w-4 text-amber-500" />, label: 'Partial' };
  };

  if (loading) return <div className="text-center py-12">Calculating status...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amoomi Payment Tracker</CardTitle>
        <CardDescription>Status for session {sessionYear} (Feb - Jan)</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Muawin</TableHead>
              {months.map(m => (
                <TableHead key={m.value} className="text-center text-[10px] uppercase font-bold min-w-[60px]">
                  {format(m.date, 'MMM')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {amoomiMuawineen.map(am => (
              <TableRow key={am.id}>
                <TableCell className="font-medium text-sm">{am.name}</TableCell>
                {months.map(m => {
                  const status = getStatus(am.id, m.value, am.amoomi_committed_amount || 0);
                  return (
                    <TableCell key={m.value} className="p-0">
                      <div className="flex items-center justify-center h-12 w-full border-l border-b-0 hover:bg-muted/50 transition-colors group">
                        <div title={status.label}>{status.icon}</div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helper needed because not imported in original file components
import { format } from "date-fns";
