import { AppLayout } from "@/components/AppLayout";
import { BarChart3, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const memberData = [
  { name: "Sarah C.", tickets: 18, resolved: 15 },
  { name: "Alex K.", tickets: 14, resolved: 12 },
  { name: "Mike J.", tickets: 22, resolved: 19 },
  { name: "Lisa W.", tickets: 10, resolved: 9 },
  { name: "James P.", tickets: 16, resolved: 14 },
];

const weeklyData = [
  { week: "W1", created: 12, resolved: 10 },
  { week: "W2", created: 18, resolved: 15 },
  { week: "W3", created: 14, resolved: 16 },
  { week: "W4", created: 20, resolved: 18 },
  { week: "W5", created: 16, resolved: 22 },
  { week: "W6", created: 24, resolved: 20 },
];

const Reports = () => {
  return (
    <AppLayout title="Reports" subtitle="Analytics and reporting">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Download className="w-3.5 h-3.5" /> Export PDF
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 animate-slide-up">
          <h3 className="text-sm font-semibold mb-4">Team Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={memberData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h3 className="text-sm font-semibold mb-4">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="resolved" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
