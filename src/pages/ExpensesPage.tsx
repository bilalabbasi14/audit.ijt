import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { ExpenseEntry, ExpenseCategory } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, Edit2, Trash2, TrendingDown, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/session';
import { cn } from '@/lib/utils.ts';
import MonthSelector from '@/components/shared/MonthSelector';
import { recalculateMonthlySummary } from '@/utils/summary';

export default function ExpensesPage() {
  const { organization } = useOrganization();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchData = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data: cData } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('org_id', organization.id)
        .order('name');
      setCategories(cData || []);

      const { data: eData, error } = await supabase
        .from('expense_entries')
        .select('*')
        .eq('org_id', organization.id)
        .eq('month', selectedMonth)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setExpenses(eData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organization, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !formData.category_id || !formData.amount) return;

    const entryData = {
      org_id: organization.id,
      category_id: formData.category_id,
      amount: parseFloat(formData.amount),
      date: formData.date,
      month: format(parseISO(formData.date), 'yyyy-MM'),
      description: formData.description || null,
    };

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('expense_entries')
          .update(entryData)
          .eq('id', editingExpense.id);
        if (error) throw error;
        toast.success('Expense entry updated');
      } else {
        const { error } = await supabase
          .from('expense_entries')
          .insert(entryData);
        if (error) throw error;
        toast.success('Expense entry added');
      }
      
      await recalculateMonthlySummary(organization.id, entryData.month);
      if (editingExpense && editingExpense.month !== entryData.month) {
        await recalculateMonthlySummary(organization.id, editingExpense.month);
      }

      setIsDialogOpen(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!organization || !newCategoryName) return;
    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert({ org_id: organization.id, name: newCategoryName });
      if (error) throw error;
      toast.success('Category added');
      setNewCategoryName('');
      setIsCategoryDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    });
  };

  const handleEdit = (e: ExpenseEntry) => {
    setEditingExpense(e);
    setFormData({
      category_id: e.category_id,
      amount: e.amount.toString(),
      date: e.date,
      description: e.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (e: ExpenseEntry) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      const { error } = await supabase.from('expense_entries').delete().eq('id', e.id);
      if (error) throw error;
      toast.success('Expense entry deleted');
      if (organization) {
        await recalculateMonthlySummary(organization.id, e.month);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const categoryBreakdown = categories.map(cat => {
    const amount = expenses
      .filter(e => e.category_id === cat.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { ...cat, total: amount };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monthly Expenses</h1>
          <div className="mt-2">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
              <Tag className="h-4 w-4" />
              Add Category
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="e.g. Stationary"
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full">Save Category</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingExpense(null); resetForm(); }
          }}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Expense
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense Entry'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex flex-col">
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between font-normal"
                          />
                        }
                      >
                        {formData.category_id
                          ? categories.find((c) => c.id === formData.category_id)?.name
                          : "Select category..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput placeholder="Search category..." />
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {categories.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  setFormData({
                                    ...formData, 
                                    category_id: c.id
                                  });
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.category_id === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Detail</Label>
                  <Input 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{editingExpense ? 'Update' : 'Save Expense'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center justify-between">
                Total Expenses
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No expenses this month</p>
              ) : (
                categoryBreakdown.map(cb => (
                  <div key={cb.id} className="flex items-center justify-between">
                    <span className="text-sm truncate mr-2">{cb.name}</span>
                    <span className="text-sm font-mono font-semibold">{formatCurrency(cb.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Expense Entries for {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                      </TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records for this month</TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e) => {
                        const c = categories.find(x => x.id === e.category_id);
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="text-sm">{format(parseISO(e.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase">{c?.name || 'Unknown'}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {e.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">{formatCurrency(e.amount)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(e)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
