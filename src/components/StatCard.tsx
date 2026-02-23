import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "destructive" | "info";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, color = "primary" }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      {change && (
        <p className={cn(
          "text-xs mt-2 font-medium",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
