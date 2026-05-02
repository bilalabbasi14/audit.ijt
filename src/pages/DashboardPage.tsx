import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { MonthlySummary, IncomeEntry, ExpenseEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/session';
import { 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  ArrowRight, 
  History, 
  Wallet,
  FileText,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils.ts';

export default function DashboardPage() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [recentIncome, setRecentIncome] = useState<IncomeEntry[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!organization) return;
      setLoading(true);
      try {
        // Fetch current month summary
        const { data: sData } = await supabase
          .from('monthly_summaries')
          .select('*')
          .eq('org_id', organization.id)
          .eq('month', currentMonth)
          .single();
        
        setSummary(sData);

        // Fetch recent income
        const { data: iData } = await supabase
          .from('income_entries')
          .select('*')
          .eq('org_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentIncome(iData || []);

        // Fetch recent expenses
        const { data: eData } = await supabase
          .from('expense_entries')
          .select('*')
          .eq('org_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentExpenses(eData || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organization]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{organization?.name || 'Dashboard'}</h1>
        <p className="text-muted-foreground">Overview of your organizational finances for {format(new Date(), 'MMMM yyyy')}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Income" 
          value={summary?.total_income || 0} 
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          color="bg-green-500/10 text-green-700 dark:text-green-400"
        />
        <StatCard 
          title="Total Expenses" 
          value={summary?.total_expenses || 0} 
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          color="bg-red-500/10 text-red-700 dark:text-red-400"
        />
        <StatCard 
          title="Last Month Balance" 
          value={summary?.last_month_balance || 0} 
          icon={<Wallet className="h-5 w-5 text-blue-500" />}
          color="bg-blue-500/10 text-blue-700 dark:text-blue-400"
        />
        <Card className={cn("border-2 shadow-sm", summary?.is_deficit ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Closing Balance</p>
              {summary?.is_deficit ? <TrendingDown className="h-5 w-5 text-destructive" /> : <TrendingUp className="h-5 w-5 text-primary" />}
            </div>
            <div className={cn("text-2xl font-black", summary?.is_deficit ? "text-destructive" : "text-primary")}>
              {formatCurrency(summary?.closing_balance || 0)}
            </div>
            <p className={cn("text-[10px] mt-1 font-bold italic uppercase", summary?.is_deficit ? "text-destructive" : "text-primary")}>
              {summary?.is_deficit ? "Financial Deficit" : "Current Surplus"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Quick Actions
            <ArrowRight className="h-4 w-4" />
          </h2>
          <div className="grid grid-cols-1 gap-2">
            <QuickLink to="/income" icon={<PlusCircle className="h-4 w-4" />} label="Add New Income" description="Record received funds" />
            <QuickLink to="/expenses" icon={<PlusCircle className="h-4 w-4" />} label="Add New Expense" description="Record spending" />
            <QuickLink to="/muawineen" icon={<Users className="h-4 w-4" />} label="Donors (Muawineen)" description="Manage your contributors" />
            <QuickLink to="/reports" icon={<FileText className="h-4 w-4" />} label="Generate Reports" description="Export PDF statements" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Recent Activity
            <History className="h-4 w-4" />
          </h2>
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">Latest Entries</CardTitle>
              <CardDescription>A combined feed of your most recent transactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[...recentIncome.map(i => ({ ...i, activityType: 'income' })), 
                  ...recentExpenses.map(e => ({ ...e, activityType: 'expense' }))]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 8)
                  .map((item: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          item.activityType === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {item.activityType === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {item.activityType === 'income' ? 'Income' : 'Expense'} Transaction
                          </p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(item.date), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-sm font-bold font-mono",
                        item.activityType === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {item.activityType === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
              </div>
              {recentIncome.length === 0 && recentExpenses.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent activity found. Start adding transactions!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-lg", color)}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-black">{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, icon, label, description }: any) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 rounded bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold leading-none mb-1">{label}</p>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
