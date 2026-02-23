import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Filter, LayoutGrid, List, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Ticket = {
  id: string;
  title: string;
  type: "Bug" | "Feature" | "Improvement" | "Task";
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  project: string;
  tags: string[];
};

type Column = {
  id: string;
  title: string;
  color: string;
  tickets: Ticket[];
};

const initialColumns: Column[] = [
  {
    id: "open",
    title: "Open",
    color: "hsl(217, 91%, 60%)",
    tickets: [
      { id: "TK-1045", title: "Fix login redirect loop on Safari", type: "Bug", priority: "Critical", assignee: "SC", project: "Mobile App v2", tags: ["auth", "ios"] },
      { id: "TK-1046", title: "Add export to PDF feature", type: "Feature", priority: "Medium", assignee: "AK", project: "Analytics", tags: ["export"] },
      { id: "TK-1047", title: "Update onboarding flow copy", type: "Task", priority: "Low", assignee: "LW", project: "E-Commerce", tags: ["ux"] },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "hsl(38, 92%, 50%)",
    tickets: [
      { id: "TK-1040", title: "Implement real-time notifications", type: "Feature", priority: "High", assignee: "MJ", project: "Mobile App v2", tags: ["websocket"] },
      { id: "TK-1041", title: "Database query optimization", type: "Improvement", priority: "High", assignee: "JP", project: "API Gateway", tags: ["perf"] },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "hsl(280, 67%, 60%)",
    tickets: [
      { id: "TK-1038", title: "Refactor auth middleware", type: "Improvement", priority: "Medium", assignee: "SC", project: "API Gateway", tags: ["security"] },
    ],
  },
  {
    id: "testing",
    title: "Testing",
    color: "hsl(199, 89%, 48%)",
    tickets: [
      { id: "TK-1035", title: "E2E tests for checkout flow", type: "Task", priority: "High", assignee: "AK", project: "E-Commerce", tags: ["qa"] },
      { id: "TK-1036", title: "Fix cart total calculation", type: "Bug", priority: "Critical", assignee: "LW", project: "E-Commerce", tags: ["payments"] },
    ],
  },
  {
    id: "closed",
    title: "Closed",
    color: "hsl(142, 71%, 45%)",
    tickets: [
      { id: "TK-1030", title: "Setup CI/CD pipeline", type: "Task", priority: "Medium", assignee: "JP", project: "DevOps", tags: ["infra"] },
    ],
  },
];

const typeColor: Record<string, string> = {
  Bug: "bg-destructive/10 text-destructive",
  Feature: "bg-primary/10 text-primary",
  Improvement: "bg-info/10 text-info",
  Task: "bg-muted text-muted-foreground",
};

const priorityDot: Record<string, string> = {
  Low: "bg-muted-foreground",
  Medium: "bg-warning",
  High: "bg-primary",
  Critical: "bg-destructive",
};

const Tickets = () => {
  const [columns, setColumns] = useState(initialColumns);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newColumns = [...columns];
    const sourceCol = newColumns.find((c) => c.id === source.droppableId)!;
    const destCol = newColumns.find((c) => c.id === destination.droppableId)!;
    const [moved] = sourceCol.tickets.splice(source.index, 1);
    destCol.tickets.splice(destination.index, 0, moved);
    setColumns(newColumns);
  };

  return (
    <AppLayout title="Tickets" subtitle="Track bugs, features, and tasks">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
            <LayoutGrid className="w-3.5 h-3.5" />
            Board
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <List className="w-3.5 h-3.5" />
            List
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <Table className="w-3.5 h-3.5" />
            Table
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
        </div>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Ticket
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[280px]">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-semibold">{col.title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md ml-1">
                  {col.tickets.length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-2 min-h-[200px] p-1.5 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-accent/50"
                    )}
                  >
                    {col.tickets.map((ticket, index) => (
                      <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing card-hover",
                              snapshot.isDragging && "shadow-lg border-primary/30 rotate-1"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                              <div className="flex items-center gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full", priorityDot[ticket.priority])} title={ticket.priority} />
                                <button className="text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm font-medium mb-2 leading-snug">{ticket.title}</p>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", typeColor[ticket.type])}>
                                {ticket.type}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-wrap gap-1">
                                {ticket.tags.map((tag) => (
                                  <span key={tag} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
                                ))}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary" title={ticket.assignee}>
                                {ticket.assignee}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </AppLayout>
  );
};

export default Tickets;
