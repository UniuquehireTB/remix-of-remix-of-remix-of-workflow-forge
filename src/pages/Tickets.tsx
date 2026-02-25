import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pencil, Trash2, MoreHorizontal, Bug, AlertCircle, Calendar, FileText, Users, ArrowRight, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { CrudDialog, DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { MemberSelector } from "@/components/MemberSelector";
import { FilterDropdown } from "@/components/AnimatedDropdown";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { statusColors, priorityColors } from "@/lib/data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectTabs } from "@/components/ProjectTabs";
import { ticketService, projectService } from "@/services/authService";

const PAGE_SIZE = 10;
const allStatuses = ["Open", "In Progress", "Closed"];
const allTypes = ["Bug", "Feature", "Improvement", "Task"];
const allPriorities = ["Low", "Medium", "High", "Critical"];

interface Ticket {
  id: number;
  ticketId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  projectId: number | null;
  dueDate: string;
  remarks: string;
  assignees: any[];
}

const emptyTicket = (): Partial<Ticket> => ({
  title: "", description: "", type: "Bug", priority: "Medium",
  projectId: null, dueDate: "", assignees: []
});

const typeIcons: Record<string, string> = {
  Bug: "🐛", Feature: "✨", Improvement: "🔧", Task: "📋",
};

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalItems: 0, itemsLeft: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState<any>("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [editData, setEditData] = useState<Partial<Ticket>>(emptyTicket());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remarkTarget, setRemarkTarget] = useState<number | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [descriptionTarget, setDescriptionTarget] = useState<Ticket | null>(null);
  const { toast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketService.getAll({
        search,
        type: typeFilter === "All" ? "" : typeFilter,
        priority: priorityFilter === "All" ? "" : priorityFilter,
        status: statusFilter === "All" ? "" : statusFilter,
        projectId: projectFilter === "All" ? undefined : (projectFilter === "General" ? "null" : projectFilter),
        page,
        limit: PAGE_SIZE
      });
      setTickets(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to load tickets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll({ limit: 100 });
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, page, typeFilter, priorityFilter, statusFilter, projectFilter]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreate = () => {
    setEditData({
      ...emptyTicket(),
      projectId: (projectFilter === "All" || projectFilter === "General") ? null : projectFilter
    });
    setEditingId(null);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (t: Ticket) => {
    setEditData({
      ...t,
      assignees: t.assignees?.map(a => a.id)
    });
    setEditingId(t.id);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.title?.trim()) e.title = "Title is required";
    if (!editData.description?.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...editData,
        assignees: editData.assignees?.map(a => typeof a === 'object' ? a.id : a)
      };

      if (editingId) {
        await ticketService.update(editingId, payload);
        toast({ title: "✅ Ticket Updated", description: `${editData.title} has been updated.` });
      } else {
        await ticketService.create(payload);
        toast({ title: "🎉 Ticket Raised", description: `${editData.title} has been created.` });
      }
      fetchTickets();
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to save ticket", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await ticketService.delete(deleteTarget.id);
        toast({ title: "🗑️ Ticket Deleted", variant: "destructive" });
        fetchTickets();
      } catch (err) {
        toast({ title: "❌ Error", description: "Failed to delete ticket", variant: "destructive" });
      }
    }
    setDeleteTarget(null);
  };

  const changeStatus = async (ticketId: number, newStatus: string) => {
    try {
      await ticketService.updateStatus(ticketId, newStatus);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      toast({ title: "Status Changed", description: `Ticket moved to ${newStatus}` });
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const saveRemark = async () => {
    if (remarkTarget) {
      try {
        await ticketService.updateRemarks(remarkTarget, remarkText);
        setTickets(prev => prev.map(t => t.id === remarkTarget ? { ...t, remarks: remarkText } : t));
        toast({ title: "✅ Remark Saved" });
      } catch (err) {
        toast({ title: "❌ Error", description: "Failed to save remark", variant: "destructive" });
      }
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
      <ProjectTabs
        projects={projects}
        activeProjectId={projectFilter}
        onChange={v => { setProjectFilter(v); setPage(1); }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown options={allTypes} value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} allLabel="All Types" />
          <FilterDropdown options={allPriorities} value={priorityFilter} onChange={v => { setPriorityFilter(v); setPage(1); }} allLabel="All Priorities" />
          <FilterDropdown options={allStatuses} value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} allLabel="All Statuses" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tickets..." />
          <Button onClick={openCreate} className="gap-2 rounded-xl shadow-lg shadow-primary/25 px-5 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Rise Ticket</span>
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-muted/30">
                {["ID", "Title", "Description", "Type", "Priority", "Status", "Due Date", "Assignees", "Remarks", "Actions"].map(h => (
                  <th key={h} className="text-left py-3.5 px-4 font-semibold text-xs tracking-wide text-muted-foreground capitalize">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="border-t border-border/50 animate-pulse">
                    {Array(10).fill(0).map((__, tdIdx) => (
                      <td key={tdIdx} className="p-4"><div className="h-4 bg-muted rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                tickets.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-t border-border/50 hover:bg-primary/[0.02] transition-colors cursor-pointer"
                    onClick={() => setDescriptionTarget(t)}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-bold whitespace-nowrap">{t.ticketId}</td>
                    <td className="py-3.5 px-4 font-semibold max-w-[180px]">
                      <span className="truncate block">{t.title}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[150px]">
                      <span className="text-xs text-muted-foreground truncate block">{t.description}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap", typeColor[t.type])}>
                        {typeIcons[t.type]} {t.type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-xs font-bold flex items-center gap-1 whitespace-nowrap", priorityColors[t.priority])}>
                        <span className={cn("w-2 h-2 rounded-full",
                          t.priority === "Critical" ? "bg-destructive" :
                            t.priority === "High" ? "bg-primary" :
                              t.priority === "Medium" ? "bg-warning" : "bg-muted-foreground"
                        )} />
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
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
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <div className="flex -space-x-1 overflow-hidden">
                        {t.assignees?.slice(0, 3).map((a, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-md bg-primary/10 border border-card flex items-center justify-center text-[8px] font-bold text-primary" title={a.username}>
                            {a.username.slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {t.assignees?.length > 3 && (
                          <div className="w-6 h-6 rounded-md bg-muted border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            +{t.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setRemarkTarget(t.id); setRemarkText(t.remarks || ""); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t.remarks ? <span className="truncate max-w-[80px]">{t.remarks}</span> : "Add"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl bg-popover border border-border shadow-xl z-50">
                          <DropdownMenuItem onClick={() => openEdit(t)} className="cursor-pointer"><Pencil className="w-3.5 h-3.5 mr-2" />Edit Ticket</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete Ticket</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && tickets.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Bug className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No tickets found</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="mt-6">
          <PaginationControls
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            totalItems={pagination.totalItems}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Rise Ticket Form */}
      <CrudDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Edit Ticket" : "Rise Ticket"}
        subtitle={editingId ? "Update ticket details" : "Create a new support or task ticket"}
        icon={<Bug className="w-5 h-5" />}
        onSave={handleSave}
        saveLabel={editingId ? "Update Ticket" : "Rise Ticket"}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Title" icon={Bug} required error={errors.title}>
            <input className={cn("premium-input", errors.title && "!border-destructive focus:ring-destructive/20")}
              placeholder="What's the issue?" value={editData.title || ""} onChange={e => { setEditData(d => ({ ...d, title: e.target.value })); setErrors(p => ({ ...p, title: "" })); }} />
          </FormField>
          <FormField label="Project" icon={FileText}>
            <AnimatedDropdown
              options={[{ label: "General", value: "" }, ...projects.map(p => ({ label: p.name, value: p.id.toString() }))]}
              value={editData.projectId?.toString() || ""}
              onChange={v => setEditData(d => ({ ...d, projectId: v ? parseInt(v) : null }))}
              placeholder="Select project"
            />
          </FormField>
        </div>
        <FormField label="Description" icon={FileText} required error={errors.description}>
          <textarea className={cn("premium-input min-h-[80px] resize-none", errors.description && "!border-destructive focus:ring-destructive/20")}
            placeholder="Describe the issue in detail..." rows={3} value={editData.description || ""} onChange={e => { setEditData(d => ({ ...d, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Type">
            <AnimatedDropdown
              options={allTypes.map(t => ({ label: t, value: t }))}
              value={editData.type || "Bug"}
              onChange={v => setEditData(d => ({ ...d, type: v as any }))}
            />
          </FormField>
          <FormField label="Priority" icon={AlertCircle}>
            <AnimatedDropdown
              options={allPriorities.map(p => ({ label: p, value: p }))}
              value={editData.priority || "Medium"}
              onChange={v => setEditData(d => ({ ...d, priority: v as any }))}
            />
          </FormField>
          <FormField label="Due Date" icon={Calendar}>
            <AnimatedDatePicker
              value={editData.dueDate || ""}
              onChange={v => setEditData(d => ({ ...d, dueDate: v }))}
              placeholder="Select due date"
            />
          </FormField>
        </div>
        <FormField label="Assignees" icon={Users}>
          <MemberSelector selected={editData.assignees || []} onChange={assignees => setEditData(d => ({ ...d, assignees }))} />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "ticket"} />

      {/* Remarks Modal */}
      <Dialog open={!!remarkTarget} onOpenChange={v => !v && setRemarkTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold capitalize">Add Remark</DialogTitle>
          </DialogHeader>
          <textarea className="premium-input min-h-[80px] resize-none" placeholder="Enter your remark..." value={remarkText} onChange={e => setRemarkText(e.target.value)} />
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
