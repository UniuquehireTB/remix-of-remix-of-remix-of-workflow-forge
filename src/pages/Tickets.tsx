import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Pencil, Trash2, MoreHorizontal, Bug, AlertCircle, Calendar, FileText, Users, ArrowRight, MessageSquare, Eye, Check, X } from "lucide-react";
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
import { ticketService, projectService, authService } from "@/services/authService";

const PAGE_SIZE = 10;
const allStatuses = ["All", "Open", "In Progress", "Closed"];
const allTypes = ["Bug", "Feature", "Improvement", "Task"];
const allPriorities = ["Low", "Medium", "High", "Critical"];

// Roles that can see all tickets and use the member filter
const PRIVILEGED_ROLES = ["Architect", "Manager", "Technical Analyst"];

interface Ticket {
  id: number;
  ticketId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  projectId: number | null;
  startDate: string;
  endDate: string;
  closedAt: string;
  remarks: string;
  assignees: any[];
}

const emptyTicket = (): Partial<Ticket> => ({
  title: "", description: "", type: "Bug", priority: "Medium",
  projectId: null, startDate: "", endDate: "", assignees: []
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
  const currentUser = authService.getCurrentUser();

  // Determine if the logged-in user has a privileged role
  const isPrivileged = PRIVILEGED_ROLES.includes(currentUser?.role);

  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Open");
  const [projectFilter, setProjectFilter] = useState<any>("All");
  // Everyone (privileged or not) starts seeing only their own assigned tickets
  const [employeeFilter, setEmployeeFilter] = useState<any>(
    currentUser?.id?.toString() ?? "All"
  );
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [closeTarget, setCloseTarget] = useState<Ticket | null>(null);
  const [manualCloseDate, setManualCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [editData, setEditData] = useState<Partial<Ticket>>(emptyTicket());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remarkTarget, setRemarkTarget] = useState<number | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [descriptionTarget, setDescriptionTarget] = useState<Ticket | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
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
        assigneeId: employeeFilter === "All" ? undefined : employeeFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
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

  const fetchMembers = async () => {
    try {
      const response = await authService.getMembersList();
      setMembers(response);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, page, typeFilter, priorityFilter, statusFilter, projectFilter, employeeFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    fetchProjects();
    fetchMembers();
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
        startDate: editData.startDate || null,
        endDate: editData.endDate || null,
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
    if (newStatus === "Closed") {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setCloseTarget(ticket);
        setManualCloseDate(new Date().toISOString().split('T')[0]);
        return;
      }
    }

    try {
      await ticketService.updateStatus(ticketId, newStatus);

      if (statusFilter !== "All" && newStatus !== statusFilter) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
      } else {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, closedAt: null } : t));
      }

      toast({ title: "Status Changed", description: `Ticket moved to ${newStatus}` });
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const confirmClose = async () => {
    if (!closeTarget) return;
    try {
      // NOTE: We're reuse the updateStatus endpoint, but the backend also supports general update.
      // For simplicity, we'll just update the status and closedAt via a standard update call if we want manual date.
      // Or we can just use updateStatus and accept that backend uses CURRENT date.
      // To honor the "manual select" request, let's use the full update call for closing.
      await ticketService.update(closeTarget.id, {
        ...closeTarget,
        status: "Closed",
        closedAt: manualCloseDate,
        assignees: closeTarget.assignees?.map(a => a.id)
      });

      if (statusFilter !== "All" && statusFilter !== "Closed") {
        setTickets(prev => prev.filter(t => t.id !== closeTarget.id));
      } else {
        setTickets(prev => prev.map(t => t.id === closeTarget.id ? { ...t, status: "Closed", closedAt: manualCloseDate } : t));
      }

      toast({ title: "✅ Ticket Closed", description: `Closed date: ${manualCloseDate}` });
      setCloseTarget(null);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to close ticket", variant: "destructive" });
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

      <div className="flex flex-col gap-4 mb-6">
        {/* Primary Row: Status + Search + Action */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex bg-muted/20 p-1 rounded-xl border border-border/40 w-full lg:w-auto h-10 overflow-x-auto scrollbar-hide">
            {allStatuses.map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    "relative px-5 py-1 text-xs font-bold transition-all duration-300 rounded-lg whitespace-nowrap flex-1 lg:flex-none",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10">{s}</span>
                  {active && (
                    <motion.div
                      layoutId="activeStatus"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto h-10">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Search tickets..."
              className="flex-1 lg:w-64 h-full"
              inputClassName="h-full !py-0 !rounded-xl bg-muted/20"
            />
            <Button onClick={openCreate} className="gap-2 rounded-xl px-5 h-full shrink-0 bg-primary hover:bg-primary/90 text-white border-none shadow-none">
              <Plus className="w-4 h-4" />
              <span className="font-bold text-xs">Rise Ticket</span>
            </Button>
          </div>
        </div>

        {/* Secondary Row: Specific Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/20 border border-border/80 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FilterDropdown
              options={allTypes}
              value={typeFilter}
              onChange={v => { setTypeFilter(v); setPage(1); }}
              allLabel="All Types"
              triggerClassName="border-border/80 !border-2 !rounded-lg h-9 bg-background text-xs font-semibold shadow-none"
            />
            <FilterDropdown
              options={allPriorities}
              value={priorityFilter}
              onChange={v => { setPriorityFilter(v); setPage(1); }}
              allLabel="All Priorities"
              triggerClassName="border-border/80 !border-2 !rounded-lg h-9 bg-background text-xs font-semibold shadow-none"
            />
          </div>

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Member filter: only visible to privileged roles */}
            {isPrivileged && (
              <div className="flex items-center gap-1.5">
                <div className="relative min-w-[170px] max-w-[220px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10 pointer-events-none">
                    <Users className="w-4 h-4" />
                  </div>
                  <AnimatedDropdown
                    size="sm"
                    options={[
                      { label: "All Members", value: "All" },
                      ...members.map(m => ({ label: m.username, value: m.id.toString() }))
                    ]}
                    value={employeeFilter}
                    onChange={v => { setEmployeeFilter(v); setPage(1); }}
                    placeholder="Select Member"
                    className="w-full"
                    triggerClassName="pl-9 border-border/80 !border-2 !rounded-lg h-9 bg-background text-xs font-semibold shadow-none"
                  />
                </div>
                {/* Reset button — appears only when filter has changed from own tickets */}
                {employeeFilter !== (currentUser?.id?.toString() ?? "All") && (
                  <button
                    onClick={() => { setEmployeeFilter(currentUser?.id?.toString() ?? "All"); setPage(1); }}
                    title="Reset to my tickets"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {isPrivileged && <div className="h-5 w-px bg-border/60 mx-1 hidden md:block" />}

            <div className="flex items-center gap-3 bg-background border border-border/80 rounded-lg px-3 h-9">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-wide">From</span>
                <AnimatedDatePicker
                  value={startDateFilter}
                  onChange={v => { setStartDateFilter(v); setPage(1); }}
                  className="border-none !p-0"
                  triggerClassName="border-none !py-0 !pr-10 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-[11px] font-bold"
                  placeholder="Date..."
                />
              </div>
              <div className="w-px h-4 bg-border/40" />
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-wide">To</span>
                <AnimatedDatePicker
                  value={endDateFilter}
                  onChange={v => { setEndDateFilter(v); setPage(1); }}
                  className="border-none !p-0"
                  triggerClassName="border-none !py-0 !pr-10 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-[11px] font-bold"
                  placeholder="Date..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-muted/30">
                {["ID", "Title", "Type", "Priority", "Status", "Start Date", "End Date", "Closed At", "Assignees", "Remarks", "Actions"].map(h => (
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
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary/20 rounded-full" />
                        <span className="font-mono text-[11px] text-primary font-bold tracking-tighter">{t.ticketId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{t.title.length > 16 ? t.title.slice(0, 16) + "..." : t.title}</span>
                        <span className="text-[10px] text-muted-foreground/70 font-medium mt-0.5">{t.description.length > 25 ? t.description.slice(0, 25) + "..." : t.description}</span>
                      </div>
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
                          {allStatuses.filter(s => s !== "All").map(s => (
                            <DropdownMenuItem key={s} onClick={() => changeStatus(t.id, s)} className={cn("text-xs font-medium", t.status === s && "bg-primary/10 text-primary")}>
                              {s} {t.status === s && <span className="ml-auto text-[10px]">✓</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {t.endDate ? new Date(t.endDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-success/70 whitespace-nowrap">
                      {t.closedAt ? new Date(t.closedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      {t.assignees?.length > 0 ? (
                        <div className="flex -space-x-1 overflow-hidden">
                          {t.assignees.slice(0, 2).map((a, idx) => (
                            <div key={idx} className="w-6 h-6 rounded-md bg-primary/10 border border-card flex items-center justify-center text-[8px] font-bold text-primary" title={a.username}>
                              {a.username.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {t.assignees.length > 2 && (
                            <div className="w-6 h-6 rounded-md bg-muted border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                              +{t.assignees.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setRemarkTarget(t.id); setRemarkText(t.remarks || ""); }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                          t.remarks
                            ? "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10"
                            : "bg-muted/30 text-muted-foreground/60 border-transparent hover:border-border hover:text-foreground"
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{t.remarks || "Add Remark"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-[20px] p-1.5 min-w-[160px] bg-popover/90 backdrop-blur-md border border-border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                          <DropdownMenuItem onClick={() => setDescriptionTarget(t)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-primary/5">
                            <Eye className="w-4 h-4 text-primary" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/40" />
                          <DropdownMenuItem onClick={() => openEdit(t)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-primary/5">
                            <Pencil className="w-4 h-4 text-primary" />
                            Edit Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-destructive cursor-pointer hover:bg-destructive/5" onClick={() => setDeleteTarget(t)}>
                            <Trash2 className="w-4 h-4" />
                            Delete Ticket
                          </DropdownMenuItem>
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
              onChange={v => {
                const newProjectId = v ? parseInt(v) : null;
                const projectMembers = projects.find(p => p.id === newProjectId)?.members?.map((m: any) => m.id) || [];

                setEditData(d => ({
                  ...d,
                  projectId: newProjectId,
                  // If project is set, filter out assignees not in that project
                  assignees: newProjectId
                    ? d.assignees?.filter(id => projectMembers.includes(id))
                    : d.assignees
                }));
              }}
              placeholder="Select project"
            />
          </FormField>
        </div>
        <FormField label="Description" icon={FileText} required error={errors.description}>
          <textarea className={cn("premium-input min-h-[80px] resize-none", errors.description && "!border-destructive focus:ring-destructive/20")}
            placeholder="Describe the issue in detail..." rows={3} value={editData.description || ""} onChange={e => { setEditData(d => ({ ...d, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start Date" icon={Calendar}>
            <AnimatedDatePicker
              value={editData.startDate || ""}
              onChange={v => setEditData(d => ({ ...d, startDate: v }))}
              placeholder="Select start date"
            />
          </FormField>
          <FormField label="End Date" icon={Calendar}>
            <AnimatedDatePicker
              value={editData.endDate || ""}
              onChange={v => setEditData(d => ({ ...d, endDate: v }))}
              placeholder="Select end date"
            />
          </FormField>
        </div>
        <FormField
          label={
            <div className="flex items-center justify-between w-full">
              <span>Assignees</span>
              {editData.projectId && (
                <span className="text-[10px] font-bold text-warning bg-warning/10 border border-warning/20 rounded-md px-2 py-0.5">
                  Only project members shown
                </span>
              )}
            </div>
          }
          icon={Users}
        >
          <MemberSelector
            selected={editData.assignees || []}
            onChange={assignees => setEditData(d => ({ ...d, assignees }))}
            allowedMemberIds={
              editData.projectId
                ? (projects.find(p => p.id === editData.projectId)?.members?.map((m: any) => m.id) ?? undefined)
                : undefined
            }
          />
        </FormField>
      </CrudDialog>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "ticket"} />

      {/* Manual Close Date Dialog */}
      <Dialog open={!!closeTarget} onOpenChange={v => !v && setCloseTarget(null)}>
        <DialogContent className="max-w-sm rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              Close Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              You are moving <span className="text-foreground font-bold">{closeTarget?.ticketId}</span> to <span className="text-success font-bold uppercase tracking-wider">Closed</span>. Please confirm the completion date.
            </p>
            <FormField label="Completion Date" icon={Calendar}>
              <AnimatedDatePicker
                value={manualCloseDate}
                onChange={setManualCloseDate}
                placeholder="Select close date"
              />
            </FormField>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCloseTarget(null)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={confirmClose} className="rounded-xl font-black px-6 shadow-lg shadow-success/20 bg-success hover:bg-success/90 text-white">Confirm Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Description Detail Modal - Premium View Section */}
      <Dialog open={!!descriptionTarget} onOpenChange={v => { if (!v) { setDescriptionTarget(null); setShowFullDesc(false); } }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-background flex flex-col">
          {/* Sticky Header */}
          <div className="shrink-0 relative">
            <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden flex items-center px-8">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
              <div className="relative flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-white/20 shrink-0">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Ticket Detail</span>
                    <span className="w-1 h-1 rounded-full bg-primary/30" />
                    <span className="text-[9px] font-mono font-bold text-primary">{descriptionTarget?.ticketId}</span>
                  </div>
                  <DialogTitle className="text-lg font-black tracking-tight text-foreground leading-tight truncate">
                    {descriptionTarget?.title}
                  </DialogTitle>
                </div>
              </div>
            </div>

            {/* Consolidated Minimal Status & Timeline Bar */}
            <div className="px-8 py-1.5 bg-muted/20 border-b border-border/40 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider border shadow-none bg-background/50", typeColor[descriptionTarget?.type || "Bug"])}>
                  {typeIcons[descriptionTarget?.type || "Bug"]} {descriptionTarget?.type}
                </Badge>
                <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider border shadow-none bg-background/50", statusColors[descriptionTarget?.status || "Open"])}>
                  {descriptionTarget?.status}
                </Badge>
                <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider border shadow-none bg-background/50 flex items-center gap-1", priorityColors[descriptionTarget?.priority || "Medium"])}>
                  <span className={cn("w-1 h-1 rounded-full animate-pulse",
                    descriptionTarget?.priority === "Critical" ? "bg-destructive" :
                      descriptionTarget?.priority === "High" ? "bg-primary" :
                        descriptionTarget?.priority === "Medium" ? "bg-warning" : "bg-muted-foreground"
                  )} />
                  {descriptionTarget?.priority}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5 opacity-80">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{descriptionTarget?.startDate ? new Date(descriptionTarget.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "TBD"}</span>
                  <ArrowRight className="w-2 h-2" />
                  <span>{descriptionTarget?.endDate ? new Date(descriptionTarget.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD"}</span>
                </div>
                {descriptionTarget?.closedAt && (
                  <div className="flex items-center gap-1.5 text-success/80 border-l border-border/60 pl-4 h-3">
                    <Check className="w-2.5 h-2.5" />
                    <span>Done {new Date(descriptionTarget.closedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto premium-scrollbar p-8 space-y-8">

            {/* Description Section - High Priority */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Detailed Description
                </h4>
                <div className="h-px bg-border/40 flex-1 ml-4" />
              </div>
              <div className="bg-muted/20 rounded-[20px] p-5 border border-border/40 relative group">
                <div className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                  {(() => {
                    const text = descriptionTarget?.description || "";
                    const isLong = text.length > 500;

                    if (!isLong || showFullDesc) {
                      return (
                        <>
                          {text}
                          {isLong && (
                            <button
                              onClick={() => setShowFullDesc(false)}
                              className="ml-2 text-primary hover:underline font-black uppercase text-[10px] tracking-wider"
                            >
                              Show Less
                            </button>
                          )}
                        </>
                      );
                    }

                    return (
                      <>
                        {text.slice(0, 500)}...
                        <button
                          onClick={() => setShowFullDesc(true)}
                          className="ml-2 text-primary hover:underline font-black uppercase text-[10px] tracking-wider"
                        >
                          Read More
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Meta Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Left Column: Project Name Only */}
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Execution Context</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center gap-3.5 bg-secondary/30 p-3.5 rounded-2xl border border-border/40">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Bug className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground/60 block uppercase tracking-wider">Project Name</span>
                        <span className="text-[12px] font-black text-foreground">
                          {descriptionTarget?.projectId ? projects.find(p => p.id === descriptionTarget.projectId)?.name : "General Workspace"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Assignees */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Responsible Team</h4>
                  <Badge variant="secondary" className="text-[8px] font-black rounded-full h-4.5">
                    {descriptionTarget?.assignees?.length || 0} Members
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-2 premium-scrollbar-small">
                  {descriptionTarget?.assignees && descriptionTarget.assignees.length > 0 ? (
                    descriptionTarget.assignees.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-background border border-border/80 p-2 rounded-2xl group hover:border-primary/40 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary border border-primary/5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          {a.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-bold text-foreground block truncate">{a.username}</span>
                          <span className="text-[9px] text-muted-foreground/60 font-medium block uppercase tracking-tighter">Contributor</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-20 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground/40 italic">
                      <Users className="w-5 h-5 mb-1.5 opacity-20" />
                      <span className="text-[11px]">No team assigned</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            {descriptionTarget?.remarks && (
              <div className="pt-2">
                <div className="bg-primary/[0.03] rounded-3xl p-5 border border-primary/10 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-primary">
                    <MessageSquare className="w-20 h-20" />
                  </div>
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Internal Resolution Note</span>
                  </div>
                  <p className="text-[12px] text-foreground/80 leading-relaxed italic font-medium relative z-10 pl-2 border-l-2 border-primary/20">
                    "{descriptionTarget.remarks}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Tickets;
