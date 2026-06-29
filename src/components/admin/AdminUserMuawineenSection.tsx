import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { format, parseISO } from 'date-fns';
import {
  createAdminMuawin,
  deleteAdminMuawin,
  fetchAdminMonthlyMuawinReport,
  fetchAdminMuawineen,
} from '@/lib/admin-api';
import type { AdminMonthlyMuawinReport, AdminMuawin, AdminMuawinPaymentStatus } from '@/types/admin';
import MonthSelector from '@/components/shared/MonthSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/session';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MinusCircle,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

type AdminUserMuawineenSectionProps = {
  userId: string;
  currency: string;
};

function StatusBadge({ status }: { status: AdminMuawinPaymentStatus }) {
  if (status === 'paid') {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Paid
      </Badge>
    );
  }
  if (status === 'partial') {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
        <AlertCircle className="h-3 w-3" />
        Partial
      </Badge>
    );
  }
  if (status === 'unpaid') {
    return (
      <Badge variant="destructive" className="gap-1">
        <MinusCircle className="h-3 w-3" />
        Unpaid
      </Badge>
    );
  }
  return <Badge variant="secondary">Khasoosi only</Badge>;
}

export function AdminUserMuawineenSection({ userId, currency }: AdminUserMuawineenSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [report, setReport] = useState<AdminMonthlyMuawinReport | null>(null);
  const [muawineen, setMuawineen] = useState<AdminMuawin[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'amoomi' as 'amoomi' | 'khasoosi' | 'both',
    amoomi_committed_amount: '',
    contact_number: '',
    address: '',
    detail: '',
  });

  const loadMuawineen = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await fetchAdminMuawineen(userId);
      setMuawineen(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load muawineen');
    } finally {
      setListLoading(false);
    }
  }, [userId]);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await fetchAdminMonthlyMuawinReport(userId, selectedMonth);
      setReport(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load monthly report');
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [userId, selectedMonth]);

  useEffect(() => {
    loadMuawineen();
  }, [loadMuawineen]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'amoomi',
      amoomi_committed_amount: '',
      contact_number: '',
      address: '',
      detail: '',
    });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await createAdminMuawin(userId, {
        name: formData.name.trim(),
        category: formData.category,
        amoomi_committed_amount:
          formData.category !== 'khasoosi'
            ? parseFloat(formData.amoomi_committed_amount) || 0
            : 0,
        contact_number: formData.contact_number.trim() || undefined,
        address: formData.address.trim() || undefined,
        detail: formData.detail.trim() || undefined,
      });
      toast.success('Muawin added');
      setIsDialogOpen(false);
      resetForm();
      await Promise.all([loadMuawineen(), loadReport()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add muawin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (muawinId: string, name: string) => {
    if (!confirm(`Delete muawin "${name}"? This fails if they have income records.`)) return;

    try {
      await deleteAdminMuawin(userId, muawinId);
      toast.success('Muawin deleted');
      await Promise.all([loadMuawineen(), loadReport()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete muawin');
    }
  };

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Muawineen
        </CardTitle>
        <CardDescription>
          Monthly collection report and donor management for this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="report" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="report">Monthly Report</TabsTrigger>
              <TabsTrigger value="manage">Manage Muawineen</TabsTrigger>
            </TabsList>
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          <TabsContent value="report" className="space-y-4">
            {reportLoading ? (
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
                    <p className="text-xs text-muted-foreground">Paid (Amoomi)</p>
                    <p className="font-semibold text-green-600">{report.summary.paidCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Unpaid (Amoomi)</p>
                    <p className="font-semibold text-destructive">{report.summary.unpaidCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Expected / Received</p>
                    <p className="font-semibold text-sm">
                      {formatCurrency(report.summary.expectedAmoomi, currency)} /{' '}
                      {formatCurrency(report.summary.receivedAmoomi, currency)}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Muawin</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Committed</TableHead>
                        <TableHead className="text-right">Amoomi Received</TableHead>
                        <TableHead className="text-right">Khasoosi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Income?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No muawineen for this organization
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.rows.map((row) => (
                          <TableRow key={row.muawinId}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell className="capitalize">{row.category}</TableCell>
                            <TableCell className="text-right">
                              {row.category !== 'khasoosi'
                                ? formatCurrency(row.committedAmount, currency)
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.category !== 'khasoosi'
                                ? formatCurrency(row.amoomiPaid, currency)
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.khasoosiPaid, currency)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={row.amoomiStatus} />
                            </TableCell>
                            <TableCell>
                              {row.hasIncome ? (
                                <span className="text-green-600 text-sm font-medium">Yes</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">No</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Could not load report for {monthLabel}
              </p>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger render={<Button className="gap-2" />}>
                  <Plus className="h-4 w-4" />
                  Add Muawin
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Muawin for User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-muawin-name">Full Name</Label>
                      <Input
                        id="admin-muawin-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) =>
                          setFormData({ ...formData, category: val as typeof formData.category })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amoomi">Amoomi (Regular)</SelectItem>
                          <SelectItem value="khasoosi">Khasoosi (Special)</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.category !== 'khasoosi' && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-muawin-amount">Committed Monthly Amount</Label>
                        <Input
                          id="admin-muawin-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amoomi_committed_amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amoomi_committed_amount: e.target.value })
                          }
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="admin-muawin-contact">Contact</Label>
                      <Input
                        id="admin-muawin-contact"
                        value={formData.contact_number}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-muawin-address">Address</Label>
                      <Input
                        id="admin-muawin-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-muawin-detail">Notes</Label>
                      <Textarea
                        id="admin-muawin-detail"
                        value={formData.detail}
                        onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Muawin'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : muawineen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No muawineen yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    muawineen.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="capitalize">{m.category}</TableCell>
                        <TableCell className="text-right">
                          {m.category !== 'khasoosi'
                            ? formatCurrency(m.amoomi_committed_amount ?? 0, currency)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{m.contact_number ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(m.id, m.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
