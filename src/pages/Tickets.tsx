import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pencil, Trash2, MoreHorizontal, Bug, AlertCircle, Calendar, FileText, Users, ArrowRight, MessageSquare, Eye, Tag } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const PAGE_SIZE = 8;
const allStatuses: TicketStatus[] = ["Open", "In Progress", "Review", "Testing", "Closed"];
const allTypes = ["Bug", "Feature", "Improvement", "Task"];
const allPriorities = ["Low", "Medium", "High", "Critical"];

const emptyTicket = (): Partial<Ticket & { remarks?: string }> => ({
  title: "", description: "", type: "Bug", priority: "Medium", status: "Open",
  assignees: [], projectId: null, tags: [], dueDate: "",
});

const typeIcons: Record<string, string> = {
  Bug: "🐛", Feature: "✨", Improvement: "🔧", Task: "📋",
};

const Tickets = () => {
  const [tickets, setTickets] = useState<(Ticket & { remarks?: string })[]>(initialTickets.map(t => ({ ...t, remarks: "" })));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(Ticket & { remarks?: string }) | null>(null);
  const [editData, setEditData] = useState<Partial<Ticket & { remarks?: string }>>(emptyTicket());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remarkTarget, setRemarkTarget] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [descriptionTarget, setDescriptionTarget] = useState<(Ticket & { remarks?: string }) | null>(null);
  const { toast } = useToast();

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || t.type === typeFilter;
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchType && matchPriority && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(emptyTicket()); setEditingId(null); setErrors({}); setDialogOpen(true); };
  const openEdit = (t: Ticket) => { setEditData({ ...t }); setEditingId(t.id); setErrors({}); setDialogOpen(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.title?.trim()) e.title = "Title is required";
    if (!editData.description?.trim()) e.description = "Description is required";
    if (!editData.dueDate?.trim()) e.dueDate = "Due date is required";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) {
      setTickets(prev => prev.map(t => t.id === editingId ? { ...t, ...editData } as any : t));
      toast({ title: "✅ Ticket Updated", description: `${editData.title} has been updated.` });
    } else {
      const newT = {
        id: `TK-${Date.now().toString().slice(-4)}`, title: editData.title || "Untitled",
        description: editData.description || "", type: (editData.type as any) || "Bug",
        priority: (editData.priority as any) || "Medium", status: (editData.status as any) || "Open",
        assignees: editData.assignees || [], projectId: editData.projectId || null,
        tags: [], createdDate: "Today", dueDate: editData.dueDate || "", remarks: "",
      };
      setTickets(prev => [...prev, newT]);
      toast({ title: "🎉 Ticket Created", description: `${newT.title} has been created.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast({ title: "🗑️ Ticket Deleted", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const changeStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    toast({ title: "Status Changed", description: `Ticket moved to ${newStatus}` });
  };

  const saveRemark = () => {
    if (remarkTarget) {
      setTickets(prev => prev.map(t => t.id === remarkTarget ? { ...t, remarks: remarkText } : t));
      toast({ title: "✅ Remark Saved" });
    }
    setRemarkTarget(null);
    setRemarkText("");
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">All Types</option>
            {allTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          {/* Priority Filter */}
          <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">All Priorities</option>
            {allPriorities.map(p => <option key={p}>{p}</option>)}
          </select>
          {/* Status Filter */}
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">All Statuses</option>
            {allStatuses.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets..." />
          <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-muted/30">
                {["ID", "Title", "Description", "Type", "Priority", "Status", "Due Date", "Assignees", "Remarks", ""].map(h => (
                  <th key={h} className="text-left py-4 px-4 font-semibold text-xs tracking-wide text-muted-foreground capitalize">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-border/50 hover:bg-primary/[0.02] transition-colors cursor-pointer"
                  onClick={() => setDescriptionTarget(t)}
                >
                  <td className="py-4 px-4 font-mono text-xs text-primary font-bold whitespace-nowrap">{t.id}</td>
                  <td className="py-4 px-4 font-semibold max-w-[180px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block">{t.title}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">{t.title}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="py-4 px-4 max-w-[150px]">
                    <span className="text-xs text-muted-foreground truncate block">{t.description?.slice(0, 40)}{(t.description?.length || 0) > 40 ? "..." : ""}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap", typeColor[t.type])}>
                      {typeIcons[t.type]} {t.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn("text-xs font-bold flex items-center gap-1 whitespace-nowrap", priorityColors[t.priority])}>
                      <span className={cn("w-2 h-2 rounded-full", t.priority === "Critical" ? "bg-destructive" : t.priority === "High" ? "bg-primary" : t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground")} />
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn("text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:ring-2 hover:ring-primary/20 whitespace-nowrap", statusColors[t.status])}>
                          {t.status}
                          <ArrowRight className="w-3 h-3 opacity-50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl min-w-[160px] bg-popover border border-border shadow-xl z-50">
                        <DropdownMenuLabel className="text-[10px] tracking-wider capitalize">Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allStatuses.map(s => (
                          <DropdownMenuItem key={s} onClick={() => changeStatus(t.id, s)} className={cn("text-xs font-medium", t.status === s && "bg-primary/10 text-primary")}>
                            {s} {t.status === s && <span className="ml-auto text-[10px]">✓</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="py-4 px-4 text-xs text-muted-foreground whitespace-nowrap">{t.dueDate || "—"}</td>
                  <td className="py-4 px-4" onClick={e => e.stopPropagation()}><AssigneeBadges ids={t.assignees} /></td>
                  <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setRemarkTarget(t.id); setRemarkText(t.remarks || ""); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t.remarks ? <span className="truncate max-w-[80px]">{t.remarks}</span> : "Add"}
                    </button>
                  </td>
                  <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl bg-popover border border-border shadow-xl z-50">
                        <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
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

      {/* Add/Edit Ticket Form */}
      <CrudDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? "Edit Ticket" : "Add Ticket"} onSave={handleSave} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Title" icon={Bug} required error={errors.title}>
            <input className={cn("premium-input", errors.title && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
              placeholder="What's the issue?" value={editData.title || ""} onChange={e => { setEditData(d => ({ ...d, title: e.target.value })); setErrors(p => ({ ...p, title: "" })); }} />
          </FormField>
          <FormField label="Due Date" icon={Calendar} required error={errors.dueDate}>
            <input type="date" className={cn("premium-input", errors.dueDate && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
              value={editData.dueDate || ""} onChange={e => { setEditData(d => ({ ...d, dueDate: e.target.value })); setErrors(p => ({ ...p, dueDate: "" })); }} />
          </FormField>
        </div>
        <FormField label="Description" icon={FileText} required error={errors.description}>
          <textarea className={cn("premium-input min-h-[120px] resize-none", errors.description && "border-destructive focus:ring-destructive/20 focus:border-destructive")}
            placeholder="Describe the issue in detail..." rows={4} value={editData.description || ""} onChange={e => { setEditData(d => ({ ...d, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormField label="Type">
            <select className="premium-select" value={editData.type || "Bug"} onChange={e => setEditData(d => ({ ...d, type: e.target.value as any }))}>
              {allTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Priority" icon={AlertCircle}>
            <select className="premium-select" value={editData.priority || "Medium"} onChange={e => setEditData(d => ({ ...d, priority: e.target.value as any }))}>
              {allPriorities.map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className="premium-select" value={editData.status || "Open"} onChange={e => setEditData(d => ({ ...d, status: e.target.value as any }))}>
              {allStatuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Project">
          <select className="premium-select" value={editData.projectId || ""} onChange={e => setEditData(d => ({ ...d, projectId: e.target.value || null }))}>
            <option value="">General</option>
            {initialProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Assignees" icon={Users}>
          <AssigneeSelector selected={editData.assignees || []} onChange={assignees => setEditData(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "ticket"} />

      {/* Remarks Modal */}
      <Dialog open={!!remarkTarget} onOpenChange={v => !v && setRemarkTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold capitalize">Add Remark</DialogTitle>
          </DialogHeader>
          <textarea className="premium-input min-h-[100px] resize-none" placeholder="Enter your remark..." value={remarkText} onChange={e => setRemarkText(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRemarkTarget(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={saveRemark} className="rounded-xl shadow-lg shadow-primary/25">Save Remark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Description Detail Modal */}
      <Dialog open={!!descriptionTarget} onOpenChange={v => !v && setDescriptionTarget(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold capitalize flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {descriptionTarget?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", typeColor[descriptionTarget?.type || "Bug"])}>
                {typeIcons[descriptionTarget?.type || "Bug"]} {descriptionTarget?.type}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", statusColors[descriptionTarget?.status || "Open"])}>
                {descriptionTarget?.status}
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{descriptionTarget?.description}</p>
            {descriptionTarget?.remarks && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm">{descriptionTarget.remarks}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Tickets;
