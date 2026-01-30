import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Building2, 
  Briefcase, 
  CalendarCheck, 
  TrendingUp, 
  Trophy,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const STAGE_COLORS: Record<string, string> = {
  lead: '#3b82f6',
  qualified: '#8b5cf6',
  proposal: '#f59e0b',
  negotiation: '#ef4444',
  closed_won: '#10b981',
  closed_lost: '#6b7280',
};

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  loading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  trend?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="card-elegant">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant group hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '€0';
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function Home() {
  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: contactsByStatus, isLoading: contactsLoading } = trpc.contacts.byStatus.useQuery();
  const { data: pipelineStats, isLoading: pipelineLoading } = trpc.deals.pipelineStats.useQuery();
  const { data: recentActivities, isLoading: activitiesLoading } = trpc.activities.recent.useQuery({ limit: 5 });

  const contactsChartData = contactsByStatus?.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  })) || [];

  const pipelineChartData = pipelineStats?.map(item => ({
    name: item.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.count,
    amount: parseFloat(item.totalValue) || 0,
    fill: STAGE_COLORS[item.stage] || '#8b5cf6',
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your CRM performance.
          </p>
        </div>
        <ExportButton
          label="Export Report"
          onExport={async (format) => {
            const result = await utils.client.export.dashboardReport.mutate({ format });
            return result;
          }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={stats?.totalContacts ?? 0}
          icon={Users}
          description="Active contacts in your CRM"
          loading={statsLoading}
        />
        <StatCard
          title="Companies"
          value={stats?.totalCompanies ?? 0}
          icon={Building2}
          description="Organizations tracked"
          loading={statsLoading}
        />
        <StatCard
          title="Active Deals"
          value={stats?.totalDeals ?? 0}
          icon={Briefcase}
          description="Opportunities in pipeline"
          loading={statsLoading}
        />
        <StatCard
          title="Open Activities"
          value={stats?.openActivities ?? 0}
          icon={CalendarCheck}
          description="Tasks pending completion"
          loading={statsLoading}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-elegant bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-4xl font-bold tracking-tight text-primary">
                {formatCurrency(stats?.pipelineValue ?? 0)}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Total value of active opportunities
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant bg-gradient-to-br from-emerald-500/5 to-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              Won Deals Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-4xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(stats?.wonDealsValue ?? 0)}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Total revenue from closed deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contacts by Status */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Contacts by Status</CardTitle>
            <CardDescription>Distribution of your contacts across different stages</CardDescription>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : contactsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contactsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {contactsChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No contacts data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Pipeline */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Deal Pipeline</CardTitle>
            <CardDescription>Number of deals at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : pipelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'value' ? value : formatCurrency(value),
                      name === 'value' ? 'Deals' : 'Value'
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No deals data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Latest actions and updates in your CRM</CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • {
                        new Date(activity.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </p>
                  </div>
                  {activity.isCompleted && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activities</p>
              <p className="text-sm">Activities will appear here as you use the CRM</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
