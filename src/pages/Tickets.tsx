import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, differenceInHours, isPast } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import {
  Plus, Pencil, Trash2, Bug, AlertCircle, Calendar,
  Users, MessageSquare, Check, X, User as UserIcon, ChevronDown, CheckCircle2,
  FileText, Activity, Clock, LayoutList, Columns, AlertTriangle, Square, RefreshCw, MinusCircle,
  Zap, CheckSquare, ArrowUpCircle, ChevronUp, Equal
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
  extendReason?: string;
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
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  // Privileged roles see all members' tickets by default; others see only their own
  const [employeeFilter, setEmployeeFilter] = useState<any>(
    isPrivileged ? "All" : (currentUser?.id?.toString() ?? "All")
  );
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  // ── Board view state (per-column, independent pagination) ─────────
  const BOARD_PAGE_SIZE = 20;
  const boardStatuses = ['Open', 'In Progress', 'On Hold', 'Closed'] as const;
  type BoardStatus = typeof boardStatuses[number];
  const [boardTickets, setBoardTickets] = useState<Record<BoardStatus, Ticket[]>>(
    { 'Open': [], 'In Progress': [], 'On Hold': [], 'Closed': [] }
  );
  const [boardPage, setBoardPage] = useState<Record<BoardStatus, number>>(
    { 'Open': 1, 'In Progress': 1, 'On Hold': 1, 'Closed': 1 }
  );
  const [boardHasMore, setBoardHasMore] = useState<Record<BoardStatus, boolean>>(
    { 'Open': false, 'In Progress': false, 'On Hold': false, 'Closed': false }
  );
  const [boardLoading, setBoardLoading] = useState<Record<BoardStatus, boolean>>(
    { 'Open': false, 'In Progress': false, 'On Hold': false, 'Closed': false }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [closeTarget, setCloseTarget] = useState<Ticket | null>(null);
  const [manualCloseDate, setManualCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [editData, setEditData] = useState<Partial<Ticket>>(emptyTicket());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [descriptionTarget, setDescriptionTarget] = useState<Ticket | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (descriptionTarget) {
      const updated = tickets.find(t => t.id === descriptionTarget.id);
      if (updated) {
        setDescriptionTarget(updated);
      }
    }
  }, [tickets]);

  const [scrolled, setScrolled] = useState(false);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 10);
  };

  const navigate = useNavigate();

  // Fetch one board column (appends if loadMore=true)
  const fetchBoardColumn = async (col: BoardStatus, page: number, append = false) => {
    setBoardLoading(prev => ({ ...prev, [col]: true }));
    try {
      const response = await ticketService.getAll({
        search,
        type: typeFilter === 'All' ? '' : typeFilter,
        priority: priorityFilter === 'All' ? '' : priorityFilter,
        status: col,                          // always filter by this column's status
        projectId: projectFilter === 'All' ? undefined : projectFilter,
        assigneeId: employeeFilter === 'All' ? undefined : employeeFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page,
        limit: BOARD_PAGE_SIZE,
      });
      setBoardTickets(prev => ({
        ...prev,
        [col]: append ? [...prev[col], ...response.data] : response.data,
      }));
      setBoardHasMore(prev => ({
        ...prev,
        [col]: response.pagination.totalPages > page,
      }));
    } catch (err) {
      console.error(`Board fetch failed for ${col}`, err);
    } finally {
      setBoardLoading(prev => ({ ...prev, [col]: false }));
    }
  };

  // Fetch all 4 columns fresh (reset to page 1)
  const fetchBoard = () => {
    const resetPages = { 'Open': 1, 'In Progress': 1, 'On Hold': 1, 'Closed': 1 };
    setBoardPage(resetPages);
    boardStatuses.forEach(col => fetchBoardColumn(col, 1, false));
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketService.getAll({
        search,
        type: typeFilter === "All" ? "" : typeFilter,
        priority: priorityFilter === "All" ? "" : priorityFilter,
        status: statusFilter === "All" ? "" : statusFilter,
        projectId: projectFilter === "All" ? undefined : projectFilter,
        assigneeId: employeeFilter === "All" ? undefined : employeeFilter,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page,
        limit: PAGE_SIZE
      });
      setTickets(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load tickets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll({ limit: 100 });
      setProjects(response.data);
      // If no projects found, redirect to projects page to create the first one
      if (response.data.length === 0) {
        navigate("/welcome", { replace: true });
      }
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

  const [stats, setStats] = useState<any>({
    'Open': 0, 'In Progress': 0, 'On Hold': 0, 'Closed': 0, 'total': 0
  });

  useEffect(() => {
    fetchTickets();
  }, [search, page, typeFilter, priorityFilter, statusFilter, projectFilter, employeeFilter, startDateFilter, endDateFilter]);

  // Board: re-fetch all columns when view is board or filters change
  useEffect(() => {
    if (viewMode === 'board') fetchBoard();
  }, [viewMode, search, typeFilter, priorityFilter, projectFilter, employeeFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ticketService.getStats(projectFilter);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch ticket stats", err);
      }
    }
    fetchStats();
  }, [projectFilter, tickets.length]); // Also refresh stats if tickets list changes (count wise)

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
      projectId: (projectFilter === "All" || projectFilter === "General") ? null : projectFilter,
      extendReason: ""
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
      })),
      extendReason: ""
    });
    setEditingId(t.id);
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate in order — stop at first error
    const showErr = (field: string, msg: string, toastMsg: string) => {
      setErrors({ [field]: msg });
      toast({ title: "Validation Error", description: toastMsg, variant: "destructive" });
    };

    if (!editData.title?.trim()) {
      showErr("title", "Title is required", "Please enter a ticket title.");
      return;
    }
    if (!editData.description?.trim()) {
      showErr("description", "Description is required", "Please enter a description.");
      return;
    }
    if (!editData.type) {
      showErr("type", "Type is required", "Please select a ticket type.");
      return;
    }
    if (!editData.priority) {
      showErr("priority", "Priority is required", "Please select a priority level.");
      return;
    }

    const hasAssigneeWithDate = editData.assignees?.some((a: any) =>
      typeof a === 'object' && a.joinDate && a.joinDate !== ""
    );

    if ((editData.startDate || hasAssigneeWithDate) && !editData.endDate) {
      showErr("endDate", "Due date is required if any dates are assigned", "Due date is required when a start date or assignee join date is set.");
      return;
    }

    if (editData.startDate && editData.endDate && new Date(editData.endDate) < new Date(editData.startDate)) {
      showErr("endDate", "Due date cannot be earlier than start date", "Due date cannot be earlier than the start date.");
      return;
    }

    if (editData.assignees && Array.isArray(editData.assignees)) {
      for (const a of editData.assignees) {
        if (typeof a === 'object' && a.joinDate) {
          const joinDate = new Date(a.joinDate);
          if (editData.endDate && joinDate > new Date(editData.endDate)) {
            showErr("assignees", "Assignee join date cannot be later than ticket due date", "An assignee's join date is after the ticket due date.");
            return;
          }
          if (editData.startDate && joinDate < new Date(editData.startDate)) {
            showErr("assignees", "Assignee join date cannot be earlier than ticket start date", "An assignee's join date is before the ticket start date.");
            return;
          }
        }
      }
    }

    // All valid — clear errors and save
    setErrors({});
    const startTime = Date.now();
    setIsSaving(true);

    try {
      const payload = {
        title: editData.title,
        description: editData.description,
        type: editData.type,
        priority: editData.priority,
        projectId: editData.projectId,
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
        toast({ title: "Ticket Updated", description: `${editData.title} has been updated.`, variant: "success" });
      } else {
        await ticketService.create(payload);
        toast({ title: "Ticket Created", description: `${editData.title} has been created.`, variant: "success" });
      }
      fetchTickets();
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save ticket", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsSaving(false), Math.max(0, 1500 - elapsed));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ticketService.delete(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Ticket Deleted", variant: "success" });
      fetchTickets();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete ticket", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
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

    const startTime = Date.now();
    setIsUpdatingStatus(true);
    try {
      await ticketService.updateStatus(ticketId, newStatus);

      if (statusFilter !== "All" && newStatus !== statusFilter) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
      } else {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, closedAt: null } : t));
      }

      toast({ title: "Status Changed", description: `Ticket moved to ${newStatus}`, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setIsUpdatingStatus(false), Math.max(0, 1500 - elapsed));
    }
  };

  const confirmClose = async () => {
    if (!closeTarget) return;
    const startTime = Date.now();
    setIsClosing(true);
    try {
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


      toast({ title: "Ticket Closed", description: `Closed date: ${manualCloseDate}`, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to close ticket", variant: "destructive" });
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        setIsClosing(false);
        setCloseTarget(null);
      }, Math.max(0, 1500 - elapsed));
    }
  };

  const handleExtendDueDate = async (ticketId: number, endDate: string, reason: string) => {
    try {
      const response = await ticketService.extendDueDate(ticketId, { endDate, reason });
      setTickets(prev => prev.map(t => t.id === ticketId ? response.ticket : t));
      if (descriptionTarget?.id === ticketId) {
        setDescriptionTarget(response.ticket);
      }
      toast({ title: "✅ Due Date Extended", description: `New due date: ${endDate}` });
    } catch (err) {
      toast({ title: "❌ Error", description: "Failed to extend due date", variant: "destructive" });
    }
  };


  const typeColor: Record<string, string> = {
    Bug: "bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]",
    Feature: "bg-[#EAE6FF] text-[#403294] border-[#C0B6F2]",
    Improvement: "bg-[#DEEBFF] text-[#0052CC] border-[#B3D4FF]",
    Task: "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]",
  };

  const statusColor: Record<string, string> = {
    "All": "text-[#42526E]",
    "Open": "text-[#42526E] bg-[#DFE1E6]",
    "In Progress": "text-[#0052CC] bg-[#DEEBFF]",
    "On Hold": "text-[#BF2600] bg-[#FFEBE6]",
    "Closed": "text-[#006644] bg-[#E3FCEF]",
  };

  return (
    <AppLayout title="Tickets" subtitle="Track bugs, features, and improvements">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
        <div
          className="flex-1 overflow-y-auto premium-scrollbar scroll-smooth"
          onScroll={handleScroll}
        >
          <div className="sticky top-0 z-20 bg-white border-b border-border/60">
            <ProjectTabs
              projects={projects}
              activeProjectId={projectFilter}
              onChange={v => { setProjectFilter(v); setPage(1); }}
              scrolled={scrolled}
            />
          </div>

          <div className="max-w-[1400px] mx-auto w-full flex flex-col px-4 sm:px-6 lg:px-8 py-4 gap-4">

            <div className="flex flex-col gap-4">
              {/* Primary Row: Status + Search + Action */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {allStatuses.map((s) => {
                      const active = statusFilter === s;
                      return (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setPage(1); }}
                          className={cn(
                            "px-3 py-1.5 text-[13px] font-medium transition-all duration-200 rounded-[3px] whitespace-nowrap flex items-center gap-2",
                            active
                              ? "bg-[#0052CC] text-white"
                              : "bg-[#F4F5F7] text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D]"
                          )}
                        >
                          <span>{s}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none",
                            active ? "bg-white/20 text-white" : "bg-[#DFE1E6] text-[#42526E]"
                          )}>
                            {s === 'All' ? stats?.total || 0 : stats?.[s] || 0}
                          </span>
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
                      triggerClassName="border-border border !rounded-[3px] h-8 !bg-white text-[13px] font-medium shadow-none min-w-[100px] px-3"
                    />
                    <FilterDropdown
                      options={allPriorities}
                      value={priorityFilter}
                      onChange={v => { setPriorityFilter(v); setPage(1); }}
                      allLabel="All Priorities"
                      triggerClassName="border-border border !rounded-[3px] h-8 !bg-white text-[13px] font-medium shadow-none min-w-[100px] px-3"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <div className="flex-1 lg:w-56 h-8">
                    <SearchBar
                      value={search}
                      onChange={v => { setSearch(v); setPage(1); }}
                      placeholder="Search tickets..."
                      className="h-full"
                      inputClassName="h-full !py-1 !rounded-[3px] !bg-white border-border focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] shadow-none !text-[13px]"
                    />
                  </div>
                  {/* View toggle */}
                  <TooltipProvider delayDuration={300}>
                    <div className="flex items-center h-8 rounded-[3px] border border-border bg-white overflow-hidden shadow-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                              "flex items-center justify-center w-8 h-full transition-all",
                              viewMode === 'table' ? "bg-[#0052CC] text-white" : "text-[#6B778C] hover:bg-[#F4F5F7]"
                            )}
                          >
                            <LayoutList className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[12px] py-1 px-2">Table view</TooltipContent>
                      </Tooltip>

                      <div className="w-px h-4 bg-border/60" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode('board')}
                            className={cn(
                              "flex items-center justify-center w-8 h-full transition-all",
                              viewMode === 'board' ? "bg-[#0052CC] text-white" : "text-[#6B778C] hover:bg-[#F4F5F7]"
                            )}
                          >
                            <Columns className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[12px] py-1 px-2">Board view</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                  <Button
                    onClick={openCreate}
                    className="gap-2 rounded-[3px] px-4 h-8 shrink-0 bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[13px]">Create</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Member filter: only visible to privileged roles */}
                {isPrivileged && (
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white px-1 rounded-[3px] border border-border h-8 items-center group">
                      <AnimatedDropdown
                        size="sm"
                        options={[
                          { label: "Everyone", value: "All" },
                          ...members.map(m => ({ label: m.username, value: m.id.toString() }))
                        ]}
                        value={employeeFilter}
                        onChange={v => { setEmployeeFilter(v); setPage(1); }}
                        placeholder="Member"
                        className="min-w-[120px]"
                        triggerClassName="border-none !h-7 !bg-transparent text-[13px] font-medium text-[#172B4D] shadow-none !px-3"
                      />
                      <div className="w-px h-4 bg-border/60 mx-1" />
                      <button
                        onClick={() => { setEmployeeFilter(currentUser?.id?.toString() ?? "All"); setPage(1); }}
                        className={cn(
                          "px-3 h-6 text-[13px] font-medium transition-all duration-200 rounded-[2px] whitespace-nowrap",
                          employeeFilter === currentUser?.id?.toString()
                            ? "bg-[#0052CC] text-white"
                            : "text-[#172B4D] hover:bg-[#EBECF0]"
                        )}
                      >
                        My Tickets
                      </button>
                    </div>
                  </div>
                )}

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-white px-1 rounded-[3px] border border-border h-8 items-center">
                    <div className="flex items-center gap-2 px-2 h-7">
                      <AnimatedDatePicker
                        value={startDateFilter}
                        onChange={v => { setStartDateFilter(v); setPage(1); }}
                        className="border-none !p-0"
                        triggerClassName="border-none !p-0 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-[13px] font-medium text-[#6B778C] [&_span]:text-[#172B4D]"
                        placeholder="Start Date"
                      />
                    </div>
                    <div className="w-px h-4 bg-border/60" />
                    <div className="flex items-center gap-2 px-2 h-7">
                      <AnimatedDatePicker
                        value={endDateFilter}
                        onChange={v => { setEndDateFilter(v); setPage(1); }}
                        className="border-none !p-0"
                        triggerClassName="border-none !p-0 !h-auto bg-transparent shadow-none hover:bg-transparent !ring-0 text-[13px] font-medium text-[#6B778C] [&_span]:text-[#172B4D]"
                        placeholder="Due Date"
                      />
                    </div>
                    {(startDateFilter || endDateFilter) && (
                      <button
                        onClick={() => { setStartDateFilter(""); setEndDateFilter(""); setPage(1); }}
                        className="w-6 h-6 flex items-center justify-center text-[#42526E] hover:text-[#DE350B] transition-colors ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Board / Table Content */}
            {viewMode === 'board' ? (
              /* ── BOARD VIEW ─────────────────────────────────────── */
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-[900px]">
                  {(['Open', 'In Progress', 'On Hold', 'Closed'] as const).map((col) => {
                    const colTickets = boardTickets[col];
                    const dotColor: Record<string, string> = {
                      'Open': '#97A0AF',
                      'In Progress': '#0052CC',
                      'On Hold': '#FF8B00',
                      'Closed': '#00875A',
                    };
                    return (
                      <div key={col} className="flex-1 flex flex-col min-w-[220px]">
                        {/* Column header — uniform neutral */}
                        <div className="flex items-center justify-between px-3 py-3 rounded-t-[3px] bg-[#F4F5F7]">
                          <div className="flex items-center gap-2">
                            {col === 'Open' && <Square className="w-3.5 h-3.5 text-[#5E6C84]" />}
                            {col === 'In Progress' && <RefreshCw className="w-3.5 h-3.5 text-[#0052CC]" />}
                            {col === 'On Hold' && <MinusCircle className="w-3.5 h-3.5 text-[#DE350B]" />}
                            {col === 'Closed' && <CheckCircle2 className="w-3.5 h-3.5 text-[#00875A]" />}
                            <span className="text-[12px] font-semibold text-[#5E6C84] uppercase tracking-wide">
                              {col}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#5E6C84]">
                              {colTickets.length}{boardHasMore[col] ? '+' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-col gap-2 bg-[#F4F5F7] rounded-b-[3px] px-2 pb-2 flex-1 min-h-[120px]">
                          {boardLoading[col] && colTickets.length === 0 ? (
                            Array(3).fill(0).map((_, i) => (
                              <div key={i} className="bg-white rounded-[3px] p-3 animate-pulse border border-border/40">
                                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                                <div className="h-2 bg-gray-100 rounded w-1/2" />
                              </div>
                            ))
                          ) : colTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-8 min-h-[120px] text-center px-4">
                              <span className="text-[13px] font-medium text-[#8A94A5] mb-1">No tickets</span>
                              <span className="text-[12px] text-[#A5ADBA]">Tickets in this status will appear here</span>
                            </div>
                          ) : (
                            <>
                              {colTickets.map((t, i) => (
                                <motion.div
                                  key={t.id}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.02 }}
                                  onClick={() => setDescriptionTarget(t)}
                                  className="bg-white rounded-[3px] p-3 border border-[#DFE1E6] hover:border-[#0052CC] cursor-pointer transition-all flex flex-col min-h-[100px]"
                                >

                                  {/* Top Row: Ticket ID + Type Tag */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[12px] text-[#6B778C] font-medium">{t.ticketId}</span>
                                    <span className={cn(
                                      "text-[11px] font-semibold px-1.5 py-0.5 rounded-[3px] flex items-center gap-1",
                                      t.type === 'Bug' ? 'bg-[#FFEBE6] text-[#BF2600]' :
                                        t.type === 'Feature' ? 'bg-[#EAE6FF] text-[#403294]' :
                                          t.type === 'Improvement' ? 'bg-[#DEEBFF] text-[#0052CC]' :
                                            'bg-[#E3FCEF] text-[#006644]'
                                    )}>
                                      {t.type === 'Bug' && <Bug className="w-3 h-3 text-[#BF2600]" />}
                                      {t.type === 'Feature' && <Activity className="w-3 h-3 text-[#403294]" />}
                                      {t.type === 'Improvement' && <LayoutList className="w-3 h-3 text-[#0052CC]" />}
                                      {t.type === 'Task' && <CheckCircle2 className="w-3 h-3 text-[#006644]" />}
                                      {t.type}
                                    </span>
                                  </div>

                                  {/* Middle Row: Title */}
                                  <p className="text-[14px] text-[#172B4D] font-medium leading-[1.3] mb-4 line-clamp-2">
                                    {t.title}
                                  </p>

                                  {/* Bottom Row: Priority + Due Date + Assignee */}
                                  <div className="flex items-center justify-between mt-auto">
                                    {/* Priority */}
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn("w-2 h-2 rounded-full",
                                        t.priority === 'Critical' ? 'bg-[#DE350B]' :
                                          t.priority === 'High' ? 'bg-[#FF8B00]' :
                                            t.priority === 'Medium' ? 'bg-[#FFC400]' : 'bg-[#00B8D9]'
                                      )} />
                                      <span className="text-[12px] text-[#6B778C] font-medium">{t.priority}</span>
                                    </div>

                                    {/* Date and Assignees */}
                                    <div className="flex items-center gap-2">
                                      {t.endDate && (
                                        <span className={cn("text-[11px] font-medium text-[#6B778C]",
                                          t.status === 'Closed' ? 'text-[#006644]' :
                                            isPast(new Date(t.endDate)) ? 'text-[#DE350B]' : 'text-[#6B778C]'
                                        )}>
                                          {format(new Date(t.endDate), 'MMM d')}
                                        </span>
                                      )}

                                      <div className="flex -space-x-1">
                                        {(t.assignees || []).slice(0, 1).map((a: any, idx: number) => (
                                          <div key={idx}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm"
                                            style={{ background: '#0052CC', color: '#fff' }}
                                          >
                                            {a.username.slice(0, 1).toUpperCase()}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                              {/* Load more */}
                              {boardHasMore[col] && (
                                <button
                                  onClick={() => {
                                    const nextPage = boardPage[col] + 1;
                                    setBoardPage(prev => ({ ...prev, [col]: nextPage }));
                                    fetchBoardColumn(col, nextPage, true);
                                  }}
                                  disabled={boardLoading[col]}
                                  className="w-full py-2 text-[12px] font-semibold text-[#0052CC] hover:text-[#0747A6] bg-white/70 hover:bg-white rounded-[3px] border border-dashed border-[#B3D4FF] hover:border-[#0052CC] transition-all disabled:opacity-50"
                                >
                                  {boardLoading[col] ? 'Loading…' : 'Load more'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── TABLE VIEW ─────────────────────────────────────── */
              <div className="animate-fade-in border border-border bg-white rounded-[3px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                  <table className="w-full text-[14px] min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-border bg-white text-[#42526E]">
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">ID</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Summary</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Type</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Status</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Assignee</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Priority</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Created</th>
                        <th className="text-left py-2 px-4 font-bold text-[12px]  tracking-wider text-[#6B778C] bg-[#F4F5F7] whitespace-nowrap border-b border-border/60">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array(5).fill(0).map((_, idx) => (
                          <tr key={idx} className="border-t border-border animate-pulse bg-white">
                            {Array(8).fill(0).map((__, tdIdx) => (
                              <td key={tdIdx} className="p-4"><div className="h-3 bg-gray-100 rounded w-full" /></td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        tickets.map((t, i) => (
                          <motion.tr
                            key={t.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="group border-t border-border/60 hover:bg-[#F4F5F7] transition-colors cursor-pointer bg-white"
                            onClick={() => setDescriptionTarget(t)}
                          >
                            <td className="py-2.5 px-4">
                              <span className="text-[12px] text-[#42526E] font-medium whitespace-nowrap">{t.ticketId}</span>
                            </td>
                            <td className="py-2.5 px-4 min-w-[200px] max-w-[350px]">
                              <span className="font-medium text-[14px] text-[#0052CC] hover:underline tracking-tight truncate block">{t.title}</span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={cn(
                                "text-[11px] font-semibold px-1.5 py-0.5 rounded-[3px] flex items-center gap-1 w-fit",
                                t.type === 'Bug' ? 'bg-[#FFEBE6] text-[#BF2600]' :
                                  t.type === 'Feature' ? 'bg-[#EAE6FF] text-[#403294]' :
                                    t.type === 'Improvement' ? 'bg-[#DEEBFF] text-[#0052CC]' :
                                      'bg-[#E3FCEF] text-[#006644]'
                              )}>
                                {t.type === 'Bug' && <Bug className="w-3 h-3 text-[#BF2600]" />}
                                {t.type === 'Feature' && <Activity className="w-3 h-3 text-[#403294]" />}
                                {t.type === 'Improvement' && <LayoutList className="w-3 h-3 text-[#0052CC]" />}
                                {t.type === 'Task' && <CheckCircle2 className="w-3 h-3 text-[#006644]" />}
                                {t.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-[3px] whitespace-nowrap flex items-center gap-1 w-fit",
                                statusColor[t.status] || "bg-[#DFE1E6] text-[#42526E]"
                              )}>
                                {t.status === 'Open' && <Square className="w-3 h-3 text-[#5E6C84]" />}
                                {t.status === 'In Progress' && <RefreshCw className="w-3 h-3 text-[#0052CC]" />}
                                {t.status === 'On Hold' && <MinusCircle className="w-3 h-3 text-[#DE350B]" />}
                                {t.status === 'Closed' && <CheckCircle2 className="w-3 h-3 text-[#00875A]" />}
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex -space-x-1.5 items-center">
                                {t.assignees && t.assignees.length > 0 ? (
                                  <TooltipProvider delayDuration={0}>
                                    {t.assignees.map((a: any, idx: number) => {
                                      const isMe = Number(a.id) === Number(currentUser?.id);
                                      return (
                                        <Tooltip key={idx}>
                                          <TooltipTrigger asChild>
                                            <div
                                              className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white transition-all transform hover:-translate-y-0.5 cursor-help",
                                                isMe ? "bg-[#0052CC] text-white z-10 shadow-sm" : "bg-[#DFE1E6] text-[#42526E] z-0"
                                              )}
                                            >
                                              {a.username.slice(0, 1).toUpperCase()}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="bg-[#172B4D] text-white border-none py-1 px-2 text-[11px] font-medium rounded-[3px] shadow-lg mb-1">
                                            <p>{a.username}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-[12px] text-gray-300 italic whitespace-nowrap">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5">
                                {t.priority === "Critical" && <AlertCircle className="w-3.5 h-3.5 text-[#E54937]" />}
                                {t.priority === "High" && <ChevronUp className="w-3.5 h-3.5 text-[#FF8B00]" />}
                                {t.priority === "Medium" && <Equal className="w-3.5 h-3.5 text-[#FFC400]" />}
                                {t.priority === "Low" && <ChevronDown className="w-3.5 h-3.5 text-[#36B37E]" />}
                                <span className="text-[13px] text-[#42526E] whitespace-nowrap">{t.priority}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="text-[13px] text-[#6B778C] whitespace-nowrap">{t.startDate ? format(new Date(t.startDate), "MMM d, yyyy") : "—"}</span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={cn("text-[13px] font-medium whitespace-nowrap",
                                (() => {
                                  if (t.status === "Closed") return "text-[#006644]";
                                  if (!t.endDate) return "text-[#6B778C]";
                                  const dueDate = new Date(t.endDate);
                                  if (isPast(dueDate)) return "text-[#DE350B]";
                                  if (differenceInHours(dueDate, new Date()) <= 12) return "text-[#FF8B00]";
                                  return "text-[#6B778C]";
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
            )}

            {!loading && tickets.length === 0 && viewMode === 'table' && (
              <div className="bg-white border border-border rounded-[3px] p-12 text-center animate-fade-in shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[#F4F5F7] flex items-center justify-center mx-auto mb-4">
                  <Bug className="w-6 h-6 text-[#6B778C]" />
                </div>
                <p className="text-[#172B4D] font-semibold text-lg">No tickets found</p>
                <p className="text-[#6B778C] text-sm mt-1">Try adjusting your filters or search terms.</p>
              </div>
            )}

            {!loading && tickets.length > 0 && viewMode === 'table' && (
              <div>
                <PaginationControls
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  totalItems={pagination.totalItems}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}

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
                  className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[50]"
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
                  title={editingId ? "Edit ticket" : "Create ticket"}
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
                  isUpdating={isUpdatingStatus}
                  onExtendDueDate={handleExtendDueDate}
                  onEdit={(t) => {
                    openEdit(t);
                  }}
                  onDelete={setDeleteTarget}
                />
              )}
            </AnimatePresence>
          </div>

          <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.title || "ticket"} loading={isDeleting} />

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
                  You are moving <span className="text-foreground font-bold">{closeTarget?.ticketId}</span> to <span className="text-success font-bold">Closed</span>. Please confirm the completion date.
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Tickets;
