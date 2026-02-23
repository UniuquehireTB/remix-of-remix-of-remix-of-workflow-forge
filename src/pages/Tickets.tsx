import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pencil, Trash2, MoreHorizontal, Bug, Tag, AlertCircle, Calendar, FileText, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { AssigneeSelector, AssigneeBadges } from "@/components/AssigneeSelector";
import { initialTickets, Ticket, TicketStatus, statusColors, priorityColors, initialProjects, getProject } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 8;
const allStatuses: TicketStatus[] = ["Open", "In Progress", "Review", "Testing", "Closed"];

const emptyTicket = (): Partial<Ticket> => ({
  title: "", description: "", type: "Bug", priority: "Medium", status: "Open",
  assignees: [], projectId: null, tags: [], dueDate: "",
});

const typeIcons: Record<string, string> = {
  Bug: "🐛", Feature: "✨", Improvement: "🔧", Task: "📋",
};

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [editData, setEditData] = useState<Partial<Ticket>>(emptyTicket());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === "All" || (projectFilter === "General" ? t.projectId === null : t.projectId === projectFilter);
    return matchSearch && matchProject;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyTicket()); setEditingId(null); setErrors({}); setDialogOpen(true); setTagsInput(""); };
  const openEdit = (t: Ticket) => { setEditData({ ...t }); setEditingId(t.id); setErrors({}); setDialogOpen(true); setTagsInput(t.tags.join(", ")); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.title?.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const tags = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    if (editingId) {
      setTickets(prev => prev.map(t => t.id === editingId ? { ...t, ...editData, tags } as Ticket : t));
      toast({ title: "✅ Ticket Updated", description: `${editData.title} has been updated.` });
    } else {
      const newT: Ticket = {
        id: `TK-${Date.now().toString().slice(-4)}`, title: editData.title || "Untitled",
        description: editData.description || "", type: (editData.type as any) || "Bug",
        priority: (editData.priority as any) || "Medium", status: (editData.status as any) || "Open",
        assignees: editData.assignees || [], projectId: editData.projectId || null,
        tags, createdDate: "Today", dueDate: editData.dueDate || "",
      };
      setTickets(prev => [...prev, newT]);
      toast({ title: "🎉 Ticket Created", description: `${newT.title} has been created.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast({ title: "🗑️ Ticket Deleted", description: `${deleteTarget.title} has been removed.`, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const changeStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    toast({ title: "Status Changed", description: `Ticket moved to ${newStatus}` });
  };

  const typeColor: Record<string, string> = {
    Bug: "bg-destructive/10 text-destructive border-destructive/20",
    Feature: "bg-primary/10 text-primary border-primary/20",
    Improvement: "bg-info/10 text-info border-info/20",
    Task: "bg-muted text-muted-foreground border-border",
  };

  return (
    <AppLayout title="Tickets" subtitle="Track bugs, features, and improvements">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl overflow-x-auto">
          <button onClick={() => { setProjectFilter("All"); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === "All" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>All</button>
          <button onClick={() => { setProjectFilter("General"); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === "General" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>General</button>
          {initialProjects.map(p => (
            <button key={p.id} onClick={() => { setProjectFilter(p.id); setPage(1); }} className={cn("px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap", projectFilter === p.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{p.name}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets..." />
          <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Premium Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Priority</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Assignees</th>
                <th className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider text-muted-foreground w-14"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <tr key={t.id} className="border-t border-border hover:bg-primary/3 transition-all duration-200 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="py-4 px-5 font-mono text-xs text-primary font-bold">{t.id}</td>
                  <td className="py-4 px-5 font-semibold max-w-[250px]">
                    <span className="truncate block">{t.title}</span>
                  </td>
                  <td className="py-4 px-5 text-xs text-muted-foreground font-medium">{t.projectId ? getProject(t.projectId)?.name : "General"}</td>
                  <td className="py-4 px-5">
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", typeColor[t.type])}>
                      {typeIcons[t.type]} {t.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-5">
                    <span className={cn("text-xs font-bold flex items-center gap-1", priorityColors[t.priority])}>
                      <span className={cn("w-2 h-2 rounded-full", t.priority === "Critical" ? "bg-destructive" : t.priority === "High" ? "bg-primary" : t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground")} />
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {/* Status with change action */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn("text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:ring-2 hover:ring-primary/20", statusColors[t.status])}>
                          {t.status}
                          <ArrowRight className="w-3 h-3 opacity-50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl min-w-[160px]">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allStatuses.map(s => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => changeStatus(t.id, s)}
                            className={cn("text-xs font-medium", t.status === s && "bg-primary/10 text-primary")}
                          >
                            <span className={cn("w-2 h-2 rounded-full mr-2", statusColors[s]?.split(" ")[0])} />
                            {s}
                            {t.status === s && <span className="ml-auto text-[10px]">✓</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="py-4 px-5"><AssigneeBadges ids={t.assignees} /></td>
                  <td className="py-4 px-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bug className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No tickets found</p>
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Ticket" : "Create New Ticket"} onSave={handleSave}>
        <FormField label="Title" icon={Bug} required error={errors.title}>
          <input className="premium-input" placeholder="What's the issue?" value={editData.title || ""} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} />
        </FormField>
        <FormField label="Description" icon={FileText}>
          <textarea className="premium-input min-h-[80px] resize-none" placeholder="Describe the issue in detail..." rows={3} value={editData.description || ""} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type">
            <select className="premium-select" value={editData.type || "Bug"} onChange={e => setEditData(d => ({ ...d, type: e.target.value as any }))}>
              <option>Bug</option><option>Feature</option><option>Improvement</option><option>Task</option>
            </select>
          </FormField>
          <FormField label="Priority" icon={AlertCircle}>
            <select className="premium-select" value={editData.priority || "Medium"} onChange={e => setEditData(d => ({ ...d, priority: e.target.value as any }))}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status">
            <select className="premium-select" value={editData.status || "Open"} onChange={e => setEditData(d => ({ ...d, status: e.target.value as any }))}>
              {allStatuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Due Date" icon={Calendar}>
            <input className="premium-input" placeholder="e.g. Mar 5" value={editData.dueDate || ""} onChange={e => setEditData(d => ({ ...d, dueDate: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Project">
          <select className="premium-select" value={editData.projectId || ""} onChange={e => setEditData(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Tags" icon={Tag}>
          <input className="premium-input" placeholder="auth, ios, perf..." value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
        </FormField>
        <FormField label="Assignees" icon={Users}>
          <AssigneeSelector selected={editData.assignees || []} onChange={assignees => setEditData(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "ticket"} />
    </AppLayout>
  );
};

export default Tickets;
