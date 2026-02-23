import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Bug, CheckCircle2, Clock, AlertTriangle, Users, FolderKanban, Timer, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const barData = [
  { name: "Mon", tickets: 12, resolved: 8 },
  { name: "Tue", tickets: 19, resolved: 14 },
  { name: "Wed", tickets: 8, resolved: 10 },
  { name: "Thu", tickets: 15, resolved: 12 },
  { name: "Fri", tickets: 22, resolved: 18 },
  { name: "Sat", tickets: 5, resolved: 6 },
  { name: "Sun", tickets: 3, resolved: 4 },
];

const pieData = [
  { name: "Open", value: 24, color: "hsl(217, 91%, 60%)" },
  { name: "In Progress", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Review", value: 8, color: "hsl(280, 67%, 60%)" },
  { name: "Closed", value: 42, color: "hsl(142, 71%, 45%)" },
];

const areaData = [
  { name: "W1", tasks: 20 },
  { name: "W2", tasks: 35 },
  { name: "W3", tasks: 28 },
  { name: "W4", tasks: 45 },
  { name: "W5", tasks: 38 },
  { name: "W6", tasks: 52 },
  { name: "W7", tasks: 48 },
  { name: "W8", tasks: 60 },
];

const recentActivity = [
  { id: 1, action: "Ticket TK-1042 moved to Review", user: "Sarah Chen", time: "2 min ago", type: "ticket" },
  { id: 2, action: "New sprint 'Sprint 14' created", user: "Alex Kumar", time: "15 min ago", type: "sprint" },
  { id: 3, action: "Bug BG-892 marked as Critical", user: "Mike Johnson", time: "32 min ago", type: "bug" },
  { id: 4, action: "Project 'Mobile App v2' updated", user: "Lisa Wang", time: "1h ago", type: "project" },
  { id: 5, action: "Task assigned to Dev Team", user: "James Park", time: "2h ago", type: "task" },
];

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, here's your overview">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tickets" value={92} change="+12% from last week" changeType="positive" icon={Bug} color="primary" />
        <StatCard title="Resolved" value={42} change="+8 this week" changeType="positive" icon={CheckCircle2} color="success" />
        <StatCard title="Overdue" value={7} change="3 critical" changeType="negative" icon={AlertTriangle} color="destructive" />
        <StatCard title="Active Sprint" value="Sprint 14" change="6 days remaining" changeType="neutral" icon={Timer} color="warning" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4">Weekly Ticket Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-card border border-border rounded-lg p-4 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4">Ticket Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productivity */}
        <div className="bg-card border border-border rounded-lg p-4 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Area type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" fill="url(#gradientArea)" strokeWidth={2} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.user} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
