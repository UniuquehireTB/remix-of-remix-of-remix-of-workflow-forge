import { AppLayout } from "@/components/AppLayout";
import { Bell, Check, Bug, FolderKanban, Timer, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { id: 1, type: "ticket", icon: Bug, title: "Ticket TK-1042 moved to Review", desc: "Sarah Chen moved the ticket", time: "2 min ago", unread: true },
  { id: 2, type: "sprint", icon: Timer, title: "Sprint 14 started", desc: "Alex Kumar created a new sprint", time: "15 min ago", unread: true },
  { id: 3, type: "comment", icon: MessageSquare, title: "New comment on TK-1040", desc: "Mike Johnson: 'The WebSocket implementation needs...'", time: "32 min ago", unread: true },
  { id: 4, type: "project", icon: FolderKanban, title: "Project 'Mobile App v2' updated", desc: "Lisa Wang updated project settings", time: "1h ago", unread: false },
  { id: 5, type: "ticket", icon: Bug, title: "Bug BG-892 marked as Critical", desc: "Priority escalated by James Park", time: "2h ago", unread: false },
  { id: 6, type: "comment", icon: MessageSquare, title: "Mentioned in TK-1038", desc: "Sarah Chen mentioned you in a comment", time: "3h ago", unread: false },
];

const Notifications = () => {
  return (
    <AppLayout title="Notifications" subtitle="Stay updated on your projects">
      <div className="max-w-2xl space-y-2">
        {notifications.map((n, i) => (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer animate-slide-up",
              n.unread ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:bg-muted/20"
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", n.unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              <n.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm", n.unread && "font-medium")}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Notifications;
