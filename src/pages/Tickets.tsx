import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, differenceInHours, isPast } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import {
  Plus, Pencil, Trash2, Bug, AlertCircle, Calendar,
  Users, MessageSquare, Check, X, User as UserIcon, ChevronDown, CheckCircle2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteDialog } from "@/components/CrudDialog";
import { FormField } from "@/components/FormField";
import { MemberSelector } from "@/components/MemberSelector";
import { AnimatedDropdown, FilterDropdown } from "@/components/AnimatedDropdown";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectTabs } from "@/components/ProjectTabs";
import { ticketService, projectService, authService } from "@/services/authService";
import { TicketDetailView } from "@/components/TicketDetailView";
import { TicketSidebarForm } from "@/components/TicketSidebarForm";
import React from "react";

const PAGE_SIZE = 10;
const allStatuses = ["All", "Open", "In Progress", "On Hold", "Closed"];
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
  assignees: any[];
}

const emptyTicket = (): Partial<Ticket> => ({
  title: "", description: "", type: "", priority: "",
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
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState<any>("All");
  // Privileged roles see all members' tickets by default; others see only their own
  const [employeeFilter, setEmployeeFilter] = useState<any>(
    isPrivileged ? "All" : (currentUser?.id?.toString() ?? "All")
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
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [descriptionTarget, setDescriptionTarget] = useState<Ticket | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (descriptionTarget) {
      const updated = tickets.find(t => t.id === descriptionTarget.id);
      if (updated) {
        setDescriptionTarget(updated);
      }
    }
  }, [tickets]);

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

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tid = searchParams.get("ticketId");
    if (tid) {
      const loadTargetTicket = async () => {
        try {
          const t = await ticketService.getById(parseInt(tid));
          setDescriptionTarget(t);
        } catch (err) {
          console.error("Failed to load ticket from URL", err);
        }
      };
      loadTargetTicket();
    }
  }, [searchParams]);

  // Instant reactive validation for dates
  useEffect(() => {
    if (!dialogOpen) return;

    setErrors(prev => {
      const e = { ...prev };
      let changed = false;

      const hasAssigneeWithDate = editData.assignees?.some(a =>
        typeof a === 'object' && a.joinDate && a.joinDate !== ""
      );

      // Validate Required End Date
      if ((editData.startDate || hasAssigneeWithDate) && !editData.endDate) {
        if (e.endDate !== "End date is required if any dates are assigned") {
          e.endDate = "End date is required if any dates are assigned";
          changed = true;
        }
      } else {
        if (e.endDate === "End date is required if any dates are assigned") {
          delete e.endDate;
          changed = true;
        }

        // Validate range if both exist
        const dateError = (editData.startDate && editData.endDate && new Date(editData.endDate) < new Date(editData.startDate))
          ? "End date cannot be earlier than start date"
          : "";

        if (e.endDate !== dateError && (dateError || e.endDate === "End date cannot be earlier than start date")) {
          if (dateError) e.endDate = dateError;
          else delete e.endDate;
          changed = true;
        }
      }

      // Validate Assignee Join Dates
      let assigneeErr = "";
      if (editData.assignees && Array.isArray(editData.assignees)) {
        for (const a of editData.assignees) {
          if (typeof a === 'object' && a.joinDate) {
            const joinDate = new Date(a.joinDate);
            if (editData.endDate && joinDate > new Date(editData.endDate)) {
              assigneeErr = "Assignee join date cannot be later than ticket end date";
              break;
            }
            if (editData.startDate && joinDate < new Date(editData.startDate)) {
              assigneeErr = "Assignee join date cannot be earlier than ticket start date";
              break;
            }
          }
        }
      }

      if (e.assignees !== assigneeErr && (assigneeErr || e.assignees?.includes("Assignee join date"))) {
        if (assigneeErr) e.assignees = assigneeErr;
        else delete e.assignees;
        changed = true;
      }

      return changed ? e : prev;
    });
  }, [editData.startDate, editData.endDate, editData.assignees, dialogOpen]);

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
      assignees: t.assignees?.map(a => ({
        id: a.id,
        joinDate: a.TicketAssignee?.joinDate || ""
      }))
    });
    setEditingId(t.id);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editData.title?.trim()) e.title = "Title is required";
    if (!editData.description?.trim()) e.description = "Description is required";
    if (!editData.type) e.type = "Type is required";
    if (!editData.priority) e.priority = "Priority is required";

    const hasAssigneeWithDate = editData.assignees?.some(a =>
      typeof a === 'object' && a.joinDate && a.joinDate !== ""
    );

    if ((editData.startDate || hasAssigneeWithDate) && !editData.endDate) {
      e.endDate = "End date is required if any dates are assigned";
    }

    if (editData.startDate && editData.endDate) {
      if (new Date(editData.endDate) < new Date(editData.startDate)) {
        e.endDate = "End date cannot be earlier than start date";
      }
    }

    // New validations for assignee join dates
    if (editData.assignees && Array.isArray(editData.assignees)) {
      for (const a of editData.assignees) {
        if (typeof a === 'object' && a.joinDate) {
          const joinDate = new Date(a.joinDate);

          if (editData.endDate) {
            const endDate = new Date(editData.endDate);
            if (joinDate > endDate) {
              e.assignees = "Assignee join date cannot be later than ticket end date";
              break;
            }
          }

          if (editData.startDate) {
            const startDate = new Date(editData.startDate);
            if (joinDate < startDate) {
              e.assignees = "Assignee join date cannot be earlier than ticket start date";
              break;
            }
          }
        }
      }
    }

    setErrors(e);
    return { isValid: Object.keys(e).length === 0, errors: e };
  };

  const handleSave = async () => {
    const { isValid, errors: foundErrors } = validate();
    if (!isValid) {
      // Find the first dependency-related error to show in a toast
      const dependencyError = Object.values(foundErrors).find(msg =>
        msg.includes("later than") ||
        msg.includes("earlier than") ||
        msg.includes("required if any dates")
      ) || (Object.keys(foundErrors).length > 0 ? "Please fill in all required fields highlighted in red." : null);

      if (dependencyError) {
        toast({
          title: "⚠️ Validation Error",
          description: dependencyError,
          variant: "destructive",
        });
      }
      return;
    }
    try {
      const payload = {
        ...editData,
        startDate: editData.startDate || null,
        endDate: editData.endDate || null,
        assignees: editData.assignees?.map(a => {
          const userId = typeof a === 'object' ? a.id : a;
          const joinDate = (typeof a === 'object' && a.joinDate) ? a.joinDate || null : null;
          return { id: userId, joinDate };
        })
      };

      if (editingId) {
        await ticketService.update(editingId, payload);
        toast({ title: "✅ Ticket Updated", description: `${editData.title} has been updated.` });

        // Update descriptionTarget manually in case it's filtered out of the list refresh
        if (descriptionTarget?.id === editingId) {
          // We can't easily reconstruct the full ticket from payload (missing ticketId etc)
          // so we fetch the updated list and wait for useEffect, 
          // but if we want to be safe for filtered cases, we could combine prev with payload.
          setDescriptionTarget(prev => prev ? ({ ...prev, ...payload }) : null);
        }
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

      if (descriptionTarget?.id === ticketId) {
        setDescriptionTarget(prev => prev ? ({ ...prev, status: newStatus, closedAt: null }) : null);
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

      if (descriptionTarget?.id === closeTarget.id) {
        setDescriptionTarget(prev => prev ? ({ ...prev, status: "Closed", closedAt: manualCloseDate }) : null);
      }

      toast({ title: "✅ Ticket Closed", description: `Closed date: ${manualCloseDate}` });
      setCloseTarget(null);
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to close ticket", variant: "destructive" });
    }
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

      <div className="flex gap-0 h-full overflow-hidden">
        {/* Main List Area */}
        <div className="flex-1 transition-all duration-300 ease-in-out overflow-y-auto premium-scrollbar pr-1">
          <div className="flex flex-col gap-4 mb-4">
            {/* Primary Row: Status + Search + Action */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 h-9 items-center overflow-x-auto scrollbar-hide">
                  {allStatuses.map((s) => {
                    const active = statusFilter === s;
                    return (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={cn(
                          "relative px-3.5 py-1 text-[11px] font-bold transition-all duration-300 rounded-lg whitespace-nowrap flex-1 lg:flex-none h-7 flex items-center justify-center",
                          active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="relative z-10">{s}</span>
                        {active && (
                          <motion.div
                            layoutId="activeStatus"
                            className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <FilterDropdown
                    options={allTypes}
                    value={typeFilter}
                    onChange={v => { setTypeFilter(v); setPage(1); }}
                    allLabel="All Types"
                    triggerClassName="border-border/50 border !rounded-xl h-9 !bg-transparent text-xs font-bold shadow-none min-w-[120px] px-4"
                  />
                  <FilterDropdown
                    options={allPriorities}
                    value={priorityFilter}
                    onChange={v => { setPriorityFilter(v); setPage(1); }}
                    allLabel="All Priorities"
                    triggerClassName="border-border/50 border !rounded-xl h-9 !bg-transparent text-xs font-bold shadow-none min-w-[120px] px-4"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="flex-1 lg:w-64 flex bg-muted/30 p-1 rounded-xl border border-border/50 h-9 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-card">
                  <SearchBar
                    value={search}
                    onChange={v => { setSearch(v); setPage(1); }}
                    placeholder="Search tickets..."
                    className="w-full h-full"
                    inputClassName="h-full !py-0 !rounded-lg !bg-transparent border-none focus:ring-0 shadow-none"
                  />
                </div>
                <Button
                  onClick={openCreate}
                  className="gap-2 rounded-xl px-5 h-9 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-bold text-xs">Rise Ticket</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Member filter: only visible to privileged roles */}
              {isPrivileged && (
                <div className="flex items-center gap-2">
                  <div className="flex !bg-transparent px-1 rounded-xl border border-border h-9 items-center group">
                    <AnimatedDropdown
                      size="sm"
                      options={[
                        { label: "Everyone", value: "All" },
                        ...members.map(m => ({ label: m.username, value: m.id.toString() }))
                      ]}
                      value={employeeFilter}
                      onChange={v => { setEmployeeFilter(v); setPage(1); }}
                      placeholder="Select Member"
                      className="min-w-[140px]"
                      triggerClassName="border-none !h-7 !bg-transparent text-xs font-bold shadow-none !px-3"
                    />
                    <div className="w-px h-4 bg-border/40" />
                    <button
                      onClick={() => { setEmployeeFilter(currentUser?.id?.toString() ?? "All"); setPage(1); }}
                      className={cn(
                        "relative px-4 h-7 text-xs font-bold transition-all duration-300 rounded-lg whitespace-nowrap ml-1",
                        employeeFilter === currentUser?.id?.toString()
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="relative z-10">My Tickets</span>
                      {employeeFilter === currentUser?.id?.toString() && (
                        <motion.div
                          layoutId="activeEmployee"
                          className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <div className="flex !bg-transparent px-1 rounded-xl border border-border h-9 items-center">
                  <div className="flex items-center gap-2 px-3 h-7">
                    <AnimatedDatePicker
                      value={startDateFilter}
                      onChange={v => { setStartDateFilter(v); setPage(1); }}
                      className="border-none !p-0"
                      triggerClassName="border-none !p-0 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-xs font-bold"
                      placeholder="Start Date"
                    />
                  </div>
                  <div className="w-px h-4 bg-border/40" />
                  <div className="flex items-center gap-2 px-3 h-7">
                    <AnimatedDatePicker
                      value={endDateFilter}
                      onChange={v => { setEndDateFilter(v); setPage(1); }}
                      className="border-none !p-0"
                      triggerClassName="border-none !p-0 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-xs font-bold"
                      placeholder="Due Date"
                    />
                  </div>
                  {(startDateFilter || endDateFilter) && (
                    <>
                      <div className="w-px h-4 bg-border/40 mx-1" />
                      <button
                        onClick={() => { setStartDateFilter(""); setEndDateFilter(""); setPage(1); }}
                        className="w-8 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="animate-fade-in border border-border/60 rounded-2xl bg-card/10 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              <table className="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100/60">
                    <th className="text-left py-4 px-6 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Ticket ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Title</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Status</th>
                    <th className="text-left py-4 px-4 font-extrabold text-[14px] text-slate-900 whitespace-nowrap">Assignee</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Priority</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Start Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-[13px] text-slate-500/80 whitespace-nowrap">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, idx) => (
                      <tr key={idx} className="border-t border-slate-50 animate-pulse">
                        {Array(8).fill(0).map((__, tdIdx) => (
                          <td key={tdIdx} className="p-4"><div className="h-4 bg-slate-50 rounded w-full" /></td>
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
                        <td className="py-4 px-6">
                          <span className="text-[12px] text-slate-400 font-medium tracking-tight whitespace-nowrap">{t.ticketId}</span>
                        </td>
                        <td className="py-4 px-4 min-w-[200px]">
                          <span className="font-medium text-[14px] text-slate-800 tracking-tight">{t.title}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn("text-[11px] font-bold px-2 py-1 rounded border whitespace-nowrap uppercase tracking-tighter",
                            t.type === "Bug" ? "bg-red-50 text-red-500 border-red-100" :
                              t.type === "Feature" ? "bg-blue-50 text-blue-500 border-blue-100" :
                                t.type === "Task" ? "bg-slate-50 text-slate-500 border-slate-100" :
                                  "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full",
                              t.status === "Closed" ? "bg-emerald-500" :
                                t.status === "In Progress" ? "bg-blue-500" :
                                  t.status === "On Hold" ? "bg-amber-500" : "bg-slate-300"
                            )} />
                            <span className="text-[13px] font-medium text-slate-600 whitespace-nowrap">{t.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex -space-x-2 items-center">
                            {t.assignees && t.assignees.length > 0 ? (
                              <>
                                <TooltipProvider delayDuration={0}>
                                  {t.assignees.map((a: any, idx: number) => {
                                    const isMe = Number(a.id) === Number(currentUser?.id);
                                    return (
                                      <Tooltip key={idx}>
                                        <TooltipTrigger asChild>
                                          <div
                                            className={cn(
                                              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] transition-transform hover:scale-110 cursor-help",
                                              isMe ? "bg-primary text-white z-10 border-primary shadow-sm" : "bg-slate-50 text-slate-500 z-0 border-slate-300"
                                            )}
                                          >
                                            {a.username.slice(0, 1).toUpperCase()}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-white text-slate-600 border border-slate-200 py-1.5 px-3 text-[11px] font-bold rounded-lg shadow-xl mb-1">
                                          <p>{a.username}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </TooltipProvider>
                              </>
                            ) : (
                              <span className="text-[12px] text-slate-300 italic whitespace-nowrap">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full",
                              t.priority === "Critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" :
                                t.priority === "High" ? "bg-orange-500" :
                                  t.priority === "Medium" ? "bg-amber-400" : "bg-blue-400"
                            )} />
                            <span className="text-[13px] font-medium text-slate-600 whitespace-nowrap">{t.priority}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-slate-400 whitespace-nowrap">{t.startDate ? format(new Date(t.startDate), "MMM d, yyyy") : "—"}</span>
                              {(() => {
                                const collabDates = t.assignees?.filter(a => a.TicketAssignee?.joinDate && a.TicketAssignee.joinDate !== t.startDate);
                                if (!collabDates || collabDates.length === 0) return null;
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="cursor-help flex items-center justify-center p-1 hover:bg-indigo-50 rounded-sm transition-colors">
                                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="p-2 min-w-[150px] rounded-xl border-indigo-100 shadow-xl">
                                        <div className="space-y-1.5">
                                          <p className="text-[10px] font-bold text-indigo-500 tracking-tight mb-1 border-b border-indigo-50 pb-1">Collaborative Join Dates</p>
                                          {collabDates.map((a, i) => (
                                            <div key={i} className="flex items-center justify-between gap-4">
                                              <span className="text-[11px] font-bold text-slate-600">{a.username}</span>
                                              <span className="text-[11px] font-medium text-slate-400">{format(new Date(a.TicketAssignee.joinDate), "MMM d")}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn("text-[13px] font-semibold tracking-tight whitespace-nowrap",
                            (() => {
                              if (!t.endDate) return "text-slate-400";
                              const dueDate = new Date(t.endDate);
                              if (isPast(dueDate)) return "text-red-500";
                              if (differenceInHours(dueDate, new Date()) <= 12) return "text-orange-500";
                              return "text-slate-400";
                            })()
                          )}>
                            {t.endDate ? format(new Date(t.endDate), "MMM d, yyyy") : "—"}
                          </span>
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

        </div>

        {/* Sidebar Overlay/Drawer Backdrop */}
        <AnimatePresence>
          {(descriptionTarget || dialogOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDescriptionTarget(null);
                setDialogOpen(false);
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            />
          )}
        </AnimatePresence>

        {/* Right Sidebar Form Panel (Edit/Rise) */}
        <AnimatePresence mode="wait">
          {dialogOpen && (
            <TicketSidebarForm
              key="ticket-form"
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title={editingId ? "Edit Ticket" : "Rise Ticket"}
              subtitle={editingId ? "Update ticket details" : "Create a new support or task ticket"}
              onSave={handleSave}
              editData={editData}
              setEditData={setEditData}
              projects={projects}
              errors={errors}
              setErrors={setErrors}
              isEditing={!!editingId}
            />
          )}
        </AnimatePresence>

        {/* Right Sidebar Detail Panel */}
        <AnimatePresence mode="wait">
          {descriptionTarget && (
            <TicketDetailView
              key="ticket-detail"
              ticket={descriptionTarget}
              projects={projects}
              onClose={() => setDescriptionTarget(null)}
              onUpdateStatus={changeStatus}
              onEdit={(t) => {
                openEdit(t);
              }}
              onDelete={setDeleteTarget}
            />
          )}
        </AnimatePresence>
      </div>

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
    </AppLayout >
  );
};

export default Tickets;
