import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: 1,
    name: "Mobile App v2",
    client: "TechCorp",
    status: "Active",
    priority: "High",
    progress: 68,
    members: 8,
    tickets: 24,
    dueDate: "Mar 15, 2026",
    techStack: ["React Native", "Node.js"],
  },
  {
    id: 2,
    name: "E-Commerce Platform",
    client: "ShopWave",
    status: "Active",
    priority: "Critical",
    progress: 42,
    members: 12,
    tickets: 56,
    dueDate: "Apr 30, 2026",
    techStack: ["Next.js", "PostgreSQL"],
  },
  {
    id: 3,
    name: "Analytics Dashboard",
    client: "DataViz Inc",
    status: "On Hold",
    priority: "Medium",
    progress: 85,
    members: 4,
    tickets: 8,
    dueDate: "Feb 28, 2026",
    techStack: ["React", "D3.js"],
  },
  {
    id: 4,
    name: "API Gateway",
    client: "CloudFirst",
    status: "Active",
    priority: "High",
    progress: 30,
    members: 6,
    tickets: 18,
    dueDate: "May 20, 2026",
    techStack: ["Go", "gRPC"],
  },
  {
    id: 5,
    name: "CRM Integration",
    client: "SalesMax",
    status: "Completed",
    priority: "Low",
    progress: 100,
    members: 3,
    tickets: 0,
    dueDate: "Jan 15, 2026",
    techStack: ["Python", "REST API"],
  },
  {
    id: 6,
    name: "DevOps Pipeline",
    client: "Internal",
    status: "Active",
    priority: "Medium",
    progress: 55,
    members: 5,
    tickets: 12,
    dueDate: "Jun 1, 2026",
    techStack: ["Docker", "K8s"],
  },
];

const statusColor: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  "On Hold": "bg-warning/10 text-warning border-warning/20",
  Completed: "bg-muted text-muted-foreground border-border",
};

const priorityColor: Record<string, string> = {
  Low: "text-muted-foreground",
  Medium: "text-warning",
  High: "text-primary",
  Critical: "text-destructive",
};

const Projects = () => {
  return (
    <AppLayout title="Projects" subtitle="Manage your organization's projects">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs">All</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Active</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Completed</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">On Hold</Button>
        </div>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project, i) => (
          <div
            key={project.id}
            className="bg-card border border-border rounded-lg p-5 card-hover animate-slide-up cursor-pointer"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{project.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={cn("text-[10px] font-medium", statusColor[project.status])}>
                {project.status}
              </Badge>
              <span className={cn("text-[10px] font-semibold", priorityColor[project.priority])}>
                {project.priority}
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Tech stack */}
            <div className="flex flex-wrap gap-1 mb-4">
              {project.techStack.map((t) => (
                <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{t}</span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{project.members}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{project.dueDate}</span>
              </div>
              <span>{project.tickets} tickets</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Projects;
