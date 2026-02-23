import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sprints = [
  {
    id: "Sprint 14",
    goal: "Complete authentication overhaul and notification system",
    status: "Active",
    startDate: "Feb 17, 2026",
    endDate: "Mar 2, 2026",
    totalTickets: 18,
    completed: 11,
    inProgress: 4,
    remaining: 3,
    velocity: 32,
  },
  {
    id: "Sprint 13",
    goal: "E-commerce checkout flow and payment integration",
    status: "Completed",
    startDate: "Feb 3, 2026",
    endDate: "Feb 16, 2026",
    totalTickets: 22,
    completed: 22,
    inProgress: 0,
    remaining: 0,
    velocity: 38,
  },
  {
    id: "Sprint 12",
    goal: "API Gateway performance optimization",
    status: "Completed",
    startDate: "Jan 20, 2026",
    endDate: "Feb 2, 2026",
    totalTickets: 15,
    completed: 14,
    inProgress: 0,
    remaining: 1,
    velocity: 28,
  },
];

const Sprints = () => {
  return (
    <AppLayout title="Sprints" subtitle="Sprint planning and tracking">
      <div className="space-y-4">
        {sprints.map((sprint, i) => (
          <div
            key={sprint.id}
            className={cn(
              "bg-card border rounded-lg p-5 card-hover animate-slide-up",
              sprint.status === "Active" ? "border-primary/30" : "border-border"
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{sprint.id}</h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      sprint.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {sprint.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sprint.goal}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{sprint.startDate} → {sprint.endDate}</p>
                <p className="font-medium text-foreground mt-1">Velocity: {sprint.velocity} pts</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div className="bg-success h-full" style={{ width: `${(sprint.completed / sprint.totalTickets) * 100}%` }} />
                <div className="bg-warning h-full" style={{ width: `${(sprint.inProgress / sprint.totalTickets) * 100}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold">{sprint.completed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-semibold">{sprint.inProgress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">{sprint.remaining}</span>
              </div>
              <span className="ml-auto text-muted-foreground">{sprint.totalTickets} total tickets</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Sprints;
