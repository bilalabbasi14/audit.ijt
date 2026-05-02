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
import { Check, ChevronsUpDown, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/session';
import MonthSelector from '@/components/shared/MonthSelector';
import { recalculateMonthlySummary } from '@/utils/summary';

import { cn } from '@/lib/utils.ts';


export default function IncomePage() {
  const { organization } = useOrganization();
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [muawineen, setMuawineen] = useState<Muawin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    muawin_id: '',
    amount: '',
    type: 'amoomi' as 'amoomi' | 'khasoosi',
    khasoosi_purpose: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const fetchData = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      // Fetch Muawineen for dropdown
      const { data: mData } = await supabase
        .from('muawineen')
        .select('*')
        .eq('org_id', organization.id)
        .order('name');
      setMuawineen(mData || []);

      // Fetch Incomes for selected month
      const { data: iData, error } = await supabase
        .from('income_entries')
        .select('*')
        .eq('org_id', organization.id)
        .eq('month', selectedMonth)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setIncomes(iData || []);
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
    if (!organization || !formData.muawin_id || !formData.amount) return;

    const muawin = muawineen.find(m => m.id === formData.muawin_id);
    const entryData = {
      org_id: organization.id,
      muawin_id: formData.muawin_id,
      amount: parseFloat(formData.amount),
      type: formData.type,
      khasoosi_purpose: formData.type === 'khasoosi' ? formData.khasoosi_purpose : null,
      date: formData.date,
      month: format(parseISO(formData.date), 'yyyy-MM'),
      notes: formData.notes || null,
    };

    try {
      if (editingIncome) {
        const { error } = await supabase
          .from('income_entries')
          .update(entryData)
          .eq('id', editingIncome.id);
        if (error) throw error;
        toast.success('Income entry updated');
      } else {
        const { error } = await supabase
          .from('income_entries')
          .insert(entryData);
        if (error) throw error;
        toast.success('Income entry added');
      }
      
      // Recalculate summaries for the month of the entry
      await recalculateMonthlySummary(organization.id, entryData.month);
      // If we edited and changed month, recalculate old month too
      if (editingIncome && editingIncome.month !== entryData.month) {
        await recalculateMonthlySummary(organization.id, editingIncome.month);
      }

      setIsDialogOpen(false);
      setEditingIncome(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      muawin_id: '',
      amount: '',
      type: 'amoomi',
      khasoosi_purpose: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    });
  };

  const handleEdit = (i: IncomeEntry) => {
    setEditingIncome(i);
    setFormData({
      muawin_id: i.muawin_id,
      amount: i.amount.toString(),
      type: i.type,
      khasoosi_purpose: i.khasoosi_purpose || '',
      date: i.date,
      notes: i.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (i: IncomeEntry) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      const { error } = await supabase.from('income_entries').delete().eq('id', i.id);
      if (error) throw error;
      toast.success('Income entry deleted');
      if (organization) {
        await recalculateMonthlySummary(organization.id, i.month);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Summary logic for display
  const totalReceived = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const amoomiReceived = incomes.filter(i => i.type === 'amoomi').reduce((sum, i) => sum + Number(i.amount), 0);
  const khasoosiReceived = incomes.filter(i => i.type === 'khasoosi').reduce((sum, i) => sum + Number(i.amount), 0);
  const expectedAmoomi = muawineen.reduce((sum, m) => sum + (m.category !== 'khasoosi' ? Number(m.amoomi_committed_amount || 0) : 0), 0);
  const amoomiGap = expectedAmoomi - amoomiReceived;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monthly Income</h1>
          <div className="mt-2">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingIncome(null); resetForm(); }
        }}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" />
            Add Income
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingIncome ? 'Edit Income' : 'Add New Income Entry'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="muawin">Muawin (Donor)</Label>
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
                      {formData.muawin_id
                        ? muawineen.find((m) => m.id === formData.muawin_id)?.name
                        : "Select donor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search muawin..." />
                        <CommandEmpty>No muawin found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {muawineen.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={m.name}
                              onSelect={() => {
                                setFormData({
                                  ...formData, 
                                  muawin_id: m.id,
                                  type: m.category === 'khasoosi' ? 'khasoosi' : 'amoomi'
                                });
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.muawin_id === m.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {m.name} ({m.category})
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
                <Label htmlFor="type">Income Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val: any) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amoomi">Amoomi (Monthly)</SelectItem>
                    <SelectItem value="khasoosi">Khasoosi (One-time/Special)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'khasoosi' && (
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose (Mandatory for Khasoosi)</Label>
                  <Input 
                    id="purpose" 
                    value={formData.khasoosi_purpose} 
                    onChange={e => setFormData({...formData, khasoosi_purpose: e.target.value})} 
                    required 
                  />
                </div>
              )}
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input 
                  id="notes" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                />
              </div>
              <DialogFooter>
                <Button type="submit">{editingIncome ? 'Update' : 'Save Entry'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Total Received" value={totalReceived} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <SummaryCard title="Amoomi" value={amoomiReceived} />
        <SummaryCard title="Khasoosi" value={khasoosiReceived} />
        <SummaryCard title="Expected Amoomi" value={expectedAmoomi} />
        <SummaryCard 
          title="Gap / Deficit" 
          value={amoomiGap} 
          isNegative={amoomiGap > 0} 
          subtitle={amoomiGap > 0 ? "Under-received" : "Surplus"} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Entries for {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Muawin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Purpose/Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : incomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records for this month</TableCell>
                  </TableRow>
                ) : (
                  incomes.map((i) => {
                    const m = muawineen.find(x => x.id === i.muawin_id);
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="text-sm">{format(parseISO(i.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="font-medium text-sm">{m?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={i.type === 'amoomi' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                            {i.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(i.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {i.type === 'khasoosi' ? i.khasoosi_purpose : (i.notes || '-')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(i)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(i)}>
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
  );
}


function SummaryCard({ title, value, icon, isNegative, subtitle }: any) {
  return (
    <Card className={cn(isNegative && "border-destructive bg-destructive/5")}>
      <CardContent className="p-4 pt-4">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="text-xl font-bold">{formatCurrency(Math.abs(value))}</div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
