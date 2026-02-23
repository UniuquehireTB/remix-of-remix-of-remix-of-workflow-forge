import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CellValue = string | number | boolean;

interface SheetColumn {
  key: string;
  label: string;
  type: "text" | "number" | "status" | "user" | "date" | "percent";
  width?: string;
}

const columns: SheetColumn[] = [
  { key: "feature", label: "Feature", type: "text", width: "200px" },
  { key: "status", label: "Status", type: "status", width: "120px" },
  { key: "owner", label: "Owner", type: "user", width: "120px" },
  { key: "priority", label: "Priority", type: "text", width: "100px" },
  { key: "dueDate", label: "Due Date", type: "date", width: "120px" },
  { key: "progress", label: "Progress", type: "percent", width: "100px" },
  { key: "estimated", label: "Est. Hours", type: "number", width: "100px" },
  { key: "actual", label: "Act. Hours", type: "number", width: "100px" },
];

const initialRows = [
  { feature: "Login Module", status: "Done", owner: "Sarah C.", priority: "High", dueDate: "Feb 12", progress: 100, estimated: 16, actual: 14 },
  { feature: "Dashboard Analytics", status: "In Progress", owner: "Alex K.", priority: "High", dueDate: "Feb 28", progress: 65, estimated: 24, actual: 15 },
  { feature: "Notification System", status: "In Progress", owner: "Mike J.", priority: "Medium", dueDate: "Mar 2", progress: 40, estimated: 20, actual: 8 },
  { feature: "Payment Integration", status: "Testing", owner: "Lisa W.", priority: "Critical", dueDate: "Feb 26", progress: 85, estimated: 32, actual: 28 },
  { feature: "Search & Filters", status: "Open", owner: "James P.", priority: "Medium", dueDate: "Mar 10", progress: 0, estimated: 12, actual: 0 },
  { feature: "File Upload System", status: "Open", owner: "Sarah C.", priority: "Low", dueDate: "Mar 15", progress: 0, estimated: 8, actual: 0 },
  { feature: "Email Templates", status: "Review", owner: "Alex K.", priority: "Medium", dueDate: "Mar 5", progress: 90, estimated: 10, actual: 9 },
  { feature: "Role Management", status: "In Progress", owner: "Mike J.", priority: "High", dueDate: "Mar 1", progress: 55, estimated: 16, actual: 10 },
];

const statusColors: Record<string, string> = {
  Done: "bg-success/10 text-success",
  "In Progress": "bg-warning/10 text-warning",
  Testing: "bg-info/10 text-info",
  Open: "bg-primary/10 text-primary",
  Review: "bg-accent text-accent-foreground",
};

const Sheets = () => {
  const [rows] = useState(initialRows);

  return (
    <AppLayout title="Sheets" subtitle="Custom spreadsheet tracking">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs">Budget Sheet</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Resource Sheet</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">QA Sheet</Button>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground"><Plus className="w-3 h-3" /> Add</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="w-10 py-2.5 px-3 border-r border-border text-xs text-muted-foreground font-medium">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="py-2.5 px-3 border-r border-border text-xs text-muted-foreground font-medium text-left" style={{ minWidth: col.width }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="py-2 px-3 border-r border-border text-xs text-muted-foreground text-center">{i + 1}</td>
                  {columns.map((col) => {
                    const val = (row as any)[col.key];
                    return (
                      <td key={col.key} className="py-2 px-3 border-r border-border text-xs">
                        {col.type === "status" ? (
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", statusColors[val] || "bg-muted text-muted-foreground")}>{val}</span>
                        ) : col.type === "percent" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }} />
                            </div>
                            <span>{val}%</span>
                          </div>
                        ) : (
                          <span>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Sheets;
