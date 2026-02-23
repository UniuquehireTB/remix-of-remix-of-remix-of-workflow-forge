import { AppLayout } from "@/components/AppLayout";
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tasks = [
  { id: 1, title: "Implement user authentication flow", project: "Mobile App v2", assignee: "Sarah Chen", priority: "High", status: "In Progress", progress: 60, dueDate: "Feb 28", estimated: "16h", actual: "10h" },
  { id: 2, title: "Design system component library", project: "E-Commerce", assignee: "Alex Kumar", priority: "Medium", status: "In Progress", progress: 40, dueDate: "Mar 5", estimated: "24h", actual: "8h" },
  { id: 3, title: "API rate limiting implementation", project: "API Gateway", assignee: "Mike Johnson", priority: "Critical", status: "Open", progress: 0, dueDate: "Feb 25", estimated: "8h", actual: "0h" },
  { id: 4, title: "Migrate database to PostgreSQL 16", project: "DevOps", assignee: "James Park", priority: "High", status: "Review", progress: 90, dueDate: "Mar 1", estimated: "12h", actual: "14h" },
  { id: 5, title: "Accessibility audit and fixes", project: "Analytics", assignee: "Lisa Wang", priority: "Medium", status: "Open", progress: 0, dueDate: "Mar 10", estimated: "20h", actual: "0h" },
  { id: 6, title: "Payment gateway integration", project: "E-Commerce", assignee: "Sarah Chen", priority: "Critical", status: "Testing", progress: 80, dueDate: "Feb 26", estimated: "32h", actual: "28h" },
];

const statusStyle: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-warning/10 text-warning",
  Review: "bg-info/10 text-info",
  Testing: "bg-success/10 text-success",
};

const priorityStyle: Record<string, string> = {
  Low: "text-muted-foreground",
  Medium: "text-warning",
  High: "text-primary",
  Critical: "text-destructive",
};

const Tasks = () => {
  return (
    <AppLayout title="Tasks" subtitle="Feature and task management">
      <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Task</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Project</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Assignee</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Due</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Time</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="py-3 px-4 font-medium max-w-[280px] truncate">{task.title}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{task.project}</td>
                  <td className="py-3 px-4 text-xs">{task.assignee}</td>
                  <td className="py-3 px-4">
                    <span className={cn("text-xs font-semibold", priorityStyle[task.priority])}>{task.priority}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className={cn("text-[10px] font-medium", statusStyle[task.status])}>
                      {task.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{task.dueDate}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{task.actual}/{task.estimated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Tasks;
