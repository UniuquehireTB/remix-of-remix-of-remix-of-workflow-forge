import { AppLayout } from "@/components/AppLayout";
import { FileText, Pin, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const notes = [
  { id: 1, title: "API Design Guidelines", project: "API Gateway", author: "Mike Johnson", date: "Feb 22", pinned: true, comments: 5, preview: "RESTful conventions, versioning strategy, and error handling patterns..." },
  { id: 2, title: "Sprint 14 Planning Notes", project: "Mobile App v2", author: "Sarah Chen", date: "Feb 20", pinned: true, comments: 8, preview: "Key objectives: auth overhaul, push notifications, performance..." },
  { id: 3, title: "Database Schema Decisions", project: "E-Commerce", author: "James Park", date: "Feb 18", pinned: false, comments: 3, preview: "PostgreSQL 16 migration plan, index optimization strategies..." },
  { id: 4, title: "UX Research Findings", project: "Analytics", author: "Lisa Wang", date: "Feb 15", pinned: false, comments: 12, preview: "User interviews revealed pain points in data export workflow..." },
  { id: 5, title: "Security Audit Checklist", project: "DevOps", author: "Alex Kumar", date: "Feb 12", pinned: false, comments: 2, preview: "OWASP top 10 review, dependency vulnerability scan results..." },
];

const Notes = () => {
  return (
    <AppLayout title="Notes" subtitle="Project documentation and notes">
      <div className="flex items-center justify-end mb-6">
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Note
        </Button>
      </div>
      <div className="space-y-3">
        {notes.map((note, i) => (
          <div
            key={note.id}
            className="bg-card border border-border rounded-lg p-4 card-hover cursor-pointer animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {note.pinned && <Pin className="w-3 h-3 text-warning shrink-0" />}
                  <h3 className="font-semibold text-sm truncate">{note.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{note.preview}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{note.project}</span>
                  <span>·</span>
                  <span>{note.author}</span>
                  <span>·</span>
                  <span>{note.date}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{note.comments}</span>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Notes;
