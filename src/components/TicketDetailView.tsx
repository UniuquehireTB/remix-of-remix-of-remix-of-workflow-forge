import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
    X, Check, Shield, User, Calendar, Clock,
    MessageSquare, Activity, Send, AlertCircle,
    MoreHorizontal, ChevronDown, CheckCircle2, Clock3,
    Pencil, Trash2,
    Users, History, CalendarClock, ChevronRight,
    Zap, CheckSquare, ArrowUpCircle, Circle, RotateCw, MinusCircle, Square,
    Bug, Maximize2, Minimize2
} from "lucide-react";
import { FormField } from "@/components/FormField";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { statusColors, priorityColors } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { commentService, authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface TicketDetailViewProps {
    ticket: any;
    projects: any[];
    onClose: () => void;
    onUpdateStatus: (id: number, status: string) => void;
    onExtendDueDate: (id: number, endDate: string, reason: string) => void;
    onEdit: (ticket: any) => void;
    onDelete: (ticket: any) => void;
    isUpdating?: boolean;
}

export function TicketDetailView({
    ticket,
    projects,
    onClose,
    onUpdateStatus,
    onExtendDueDate,
    onEdit,
    onDelete,
    isUpdating = false
}: TicketDetailViewProps) {
    const [comments, setComments] = React.useState<any[]>([]);
    const [comment, setComment] = React.useState("");
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"comments" | "extensions">("comments");
    const [extending, setExtending] = React.useState(false);
    const [isExtending, setIsExtending] = React.useState(false);
    const [newDueDate, setNewDueDate] = React.useState("");
    const [extendReason, setExtendReason] = React.useState("");
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const currentUser = authService.getCurrentUser();
    const { toast } = useToast();

    const fetchComments = async () => {
        try {
            const data = await commentService.getAllByTicket(ticket.id);
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    };

    React.useEffect(() => {
        if (ticket?.id) {
            fetchComments();
            setActiveTab("comments");
        }
    }, [ticket?.id]);

    const handleSendComment = async () => {
        if (!comment.trim() || sending) return;
        const startTime = Date.now();
        setSending(true);
        try {
            await commentService.create(ticket.id, comment);
            setComment("");
            fetchComments();
        } catch (err) {
            toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
        } finally {
            const elapsed = Date.now() - startTime;
            setTimeout(() => setSending(false), Math.max(0, 1500 - elapsed));
        }
    };

    if (!ticket) return null;

    const project = projects.find(p => p.id === ticket.projectId);
    const createdDate = ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt)) + " ago" : "—";

    const handleExtend = async () => {
        if (!newDueDate || !extendReason.trim()) return;
        const startTime = Date.now();
        setIsExtending(true);
        try {
            await onExtendDueDate(ticket.id, newDueDate, extendReason);
            setExtending(false);
            setNewDueDate("");
            setExtendReason("");
            toast({ title: "Extension Requested", description: "The due date extension has been submitted.", variant: "success" });
            setActiveTab("extensions");
        } catch (err) {
            toast({ title: "Error", description: "Failed to request due date extension.", variant: "destructive" });
        } finally {
            const elapsed = Date.now() - startTime;
            setTimeout(() => setIsExtending(false), Math.max(0, 1500 - elapsed));
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#091E42]/50 backdrop-blur-sm z-[105]"
                onClick={onClose}
            />
            <motion.div
                layout
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={cn(
                    "fixed inset-y-0 right-0 bg-white border-l border-border shadow-2xl z-[110] flex flex-col overflow-hidden transition-[width] duration-300",
                    isFullScreen ? "w-[calc(100%-40px)] lg:w-[1200px]" : "w-[550px]"
                )}
            >
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-white min-h-[56px] shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-[12px] font-bold text-[#42526E]">
                            {ticket.ticketId}
                        </span>
                        <div className="w-px h-4 bg-border/60" />
                        <span className={cn("flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] border whitespace-nowrap",
                            ticket.type === "Bug" ? "bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]" :
                                ticket.type === "Feature" ? "bg-[#EAE6FF] text-[#403294] border-[#C0B6F2]" :
                                    ticket.type === "Task" ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]" :
                                        "bg-[#DEEBFF] text-[#0052CC] border-[#B3D4FF]"
                        )}>
                            {ticket.type === "Bug" && <Bug className="w-3 h-3" />}
                            {ticket.type === "Feature" && <Zap className="w-3 h-3" />}
                            {ticket.type === "Task" && <CheckSquare className="w-3 h-3" />}
                            {ticket.type === "Improvement" && <ArrowUpCircle className="w-3 h-3" />}
                            {ticket.type}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" loading={isUpdating} className="h-8 gap-2 px-3 rounded-[3px] border border-border bg-white hover:bg-[#F4F5F7] transition-all shadow-sm">
                                        <div className={cn("flex items-center gap-1.5")}>
                                            {ticket.status === "Open" && <Square className="w-3.5 h-3.5 text-[#42526E]" />}
                                            {ticket.status === "In Progress" && <RotateCw className="w-3.5 h-3.5 text-[#0052CC]" />}
                                            {ticket.status === "On Hold" && <MinusCircle className="w-3.5 h-3.5 text-[#BF2600]" />}
                                            {ticket.status === "Closed" && <CheckCircle2 className="w-3.5 h-3.5 text-[#006644]" />}
                                            <span className="text-[12px] font-bold text-[#42526E]">{ticket.status}</span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-[#42526E]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-[3px] p-1 shadow-lg border-border">
                                    {["Open", "In Progress", "On Hold", "Closed"].map((status) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => onUpdateStatus(ticket.id, status)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-[2px] cursor-pointer transition-colors",
                                                ticket.status === status ? "bg-[#DEEBFF] text-[#0052CC]" : "text-[#42526E] hover:bg-[#F4F5F7]"
                                            )}
                                        >
                                            {status === "Open" && <Square className="w-3.5 h-3.5 text-[#42526E]" />}
                                            {status === "In Progress" && <RotateCw className="w-3.5 h-3.5 text-[#0052CC]" />}
                                            {status === "On Hold" && <MinusCircle className="w-3.5 h-3.5 text-[#BF2600]" />}
                                            {status === "Closed" && <CheckCircle2 className="w-3.5 h-3.5 text-[#006644]" />}
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] hover:bg-[#F4F5F7] text-[#42526E]" onClick={() => onEdit(ticket)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] hover:bg-[#FFEBE6] hover:text-[#BF2600] text-[#42526E]" onClick={() => onDelete(ticket)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">Delete</TooltipContent>
                            </Tooltip>

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] hover:bg-[#F4F5F7] text-[#42526E]" onClick={() => setIsFullScreen(!isFullScreen)}>
                                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">{isFullScreen ? "Restore" : "Maximize"}</TooltipContent>
                            </Tooltip>

                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] ml-1 text-[#42526E] hover:bg-[#EBECF0]" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Scrollable Column */}
                    <div className="flex-1 overflow-y-auto premium-scrollbar bg-white dark:bg-card">
                        <div className={cn("mx-auto transition-all duration-300", isFullScreen ? "max-w-none px-8 py-8 space-y-8" : "p-5 space-y-5")}>
                            <div className="space-y-4">
                                <h1 className={cn("font-bold tracking-tight text-[#172B4D] leading-tight break-words transition-all", isFullScreen ? "text-4xl" : "text-xl")}>
                                    {ticket.title}
                                </h1>

                                <div className={cn("space-y-2", isFullScreen && "pt-2")}>
                                    <label className={cn("font-bold text-[#42526E]", isFullScreen ? "text-[14px]" : "text-[12px]")}>Description</label>
                                    <div className="relative group">
                                        <div className={cn(
                                            "text-[14px] text-[#172B4D] leading-relaxed break-words whitespace-pre-wrap p-3 rounded-[3px] border border-transparent transition-all",
                                            !isExpanded && ticket.description?.length > 300 && "line-clamp-[6]",
                                            "hover:bg-[#F4F5F7] hover:border-border cursor-text"
                                        )}>
                                            {ticket.description || "No description provided."}
                                        </div>
                                        {ticket.description?.length > 300 && (
                                            <button
                                                onClick={() => setIsExpanded(!isExpanded)}
                                                className="text-[12px] font-bold text-[#0052CC] hover:underline mt-2 flex items-center gap-1"
                                            >
                                                {isExpanded ? "Show less" : "Show more"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border/40" />

                            {/* Activity Tabs */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-6 border-b border-border">
                                    <button
                                        onClick={() => setActiveTab("comments")}
                                        className={cn(
                                            "pb-2.5 text-[14px] font-bold transition-all relative",
                                            activeTab === "comments" ? "text-[#0052CC]" : "text-[#42526E] hover:text-[#172B4D]"
                                        )}
                                    >
                                        Comments
                                        {activeTab === "comments" && (
                                            <motion.div layoutId="activeDetailTab" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#0052CC] rounded-t-[1px]" />
                                        )}
                                    </button>
                                    {ticket.dueHistory?.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab("extensions")}
                                            className={cn(
                                                "pb-2.5 text-[14px] font-bold transition-all relative",
                                                activeTab === "extensions" ? "text-[#0052CC]" : "text-[#42526E] hover:text-[#172B4D]"
                                            )}
                                        >
                                            History
                                            {activeTab === "extensions" && (
                                                <motion.div layoutId="activeDetailTab" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#0052CC] rounded-t-[1px]" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence mode="wait">
                                    {activeTab === "comments" ? (
                                        <motion.div
                                            key="comments-tab"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4 pb-4"
                                        >
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#DFE1E6] shrink-0 flex items-center justify-center font-bold text-[#42526E] text-[11px]">
                                                    {currentUser?.username?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                                        placeholder="Add a comment..."
                                                        className="w-full h-9 bg-white border border-border rounded-[3px] px-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] transition-all"
                                                        disabled={sending}
                                                    />
                                                    {comment.trim() && (
                                                        <div className="flex items-center gap-2 animate-fade-in">
                                                            <Button size="sm" onClick={handleSendComment} loading={sending} className="h-7 px-3 bg-[#0052CC] hover:bg-[#0747A6] rounded-[3px] text-[12px] font-bold text-white">Save</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => setComment("")} className="h-7 px-3 rounded-[3px] text-[12px] font-bold text-[#42526E]">Cancel</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {comments.length > 0 ? (
                                                <div className="space-y-6 pt-4">
                                                    {comments.map((c) => (
                                                        <div key={c.id} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#EBECF0] shrink-0 flex items-center justify-center font-bold text-[#42526E] text-[11px]">
                                                                {c.user?.username?.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[13px] font-bold text-[#172B4D]">{c.user?.username}</span>
                                                                    <span className="text-[11px] text-[#6B778C]">
                                                                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[14px] text-[#172B4D] leading-relaxed">
                                                                    {c.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 flex flex-col items-center justify-center text-[#6B778C]">
                                                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                                                    <p className="text-[13px] font-medium">No comments yet.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="history-tab"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4 pb-4"
                                        >
                                            {ticket.dueHistory?.map((h: any, i: number) => (
                                                <div key={i} className="flex gap-3 pb-4 border-b border-border/40 last:border-0 pt-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#EBECF0] shrink-0 flex items-center justify-center">
                                                        <History className="w-4 h-4 text-[#42526E]" />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[13px] font-bold text-[#172B4D]">{h.username || 'System'}</p>
                                                            <span className="text-[11px] text-[#6B778C]">{format(new Date(h.timestamp), "MMM d, yyyy")}</span>
                                                        </div>
                                                        <div className="bg-[#F4F5F7] p-3 rounded-[3px] border border-border/60">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="flex-1">
                                                                    <p className="text-[10px] font-bold text-[#6B778C]">From</p>
                                                                    <p className="text-[12px] text-[#42526E] line-through">{h.from ? format(new Date(h.from), "MMM d") : "—"}</p>
                                                                </div>
                                                                <ChevronRight className="w-3.5 h-3.5 text-[#C1C7D0]" />
                                                                <div className="flex-1">
                                                                    <p className="text-[10px] font-bold text-[#0052CC]">To</p>
                                                                    <p className="text-[13px] font-bold text-[#0052CC]">{h.to ? format(new Date(h.to), "MMM d") : "—"}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[13px] text-[#172B4D] italic leading-relaxed">"{h.reason}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Fields Sidebar Column */}
                    <div className={cn("shrink-0 border-l border-border bg-[#F4F5F7] dark:bg-card p-6 space-y-8 overflow-y-auto transition-all premium-scrollbar dark:premium-scrollbar", isFullScreen ? "w-[320px]" : "w-[200px]")}>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-[12px] font-bold text-[#42526E] border-b border-border pb-2">Details</h2>

                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-bold text-[#42526E]">Assignee</label>
                                        <div className="space-y-2">
                                            {ticket.assignees && ticket.assignees.length > 0 ? (
                                                <div className="space-y-2">
                                                    {ticket.assignees.slice(0, 4).map((a: any, idx: number) => {
                                                        const mStartDate = a.TicketAssignee?.startDate;
                                                        const mEndDate = a.TicketAssignee?.endDate;
                                                        return (
                                                            <div key={idx} className="flex flex-col gap-1.5 p-2 rounded-[4px] hover:bg-white/50 transition-colors border border-transparent hover:border-border/40">
                                                                <div className="flex items-center gap-2.5 group">
                                                                    <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                                        {a.username.slice(0, 1).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-[13px] text-[#172B4D] font-bold group-hover:text-[#0052CC] transition-colors truncate">{a.username}</span>
                                                                </div>
                                                                {mStartDate && (
                                                                    <div className="flex items-center gap-2 pl-8">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[8px] font-bold text-[#6B778C] uppercase leading-none mb-0.5">Start</span>
                                                                            <span className="text-[11px] font-bold text-[#172B4D] leading-none bg-white px-1 py-0.5 rounded-[2px] border border-border/60 shadow-sm">
                                                                                {format(new Date(mStartDate), "MMM d")}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {ticket.assignees.length > 4 && (
                                                        <div className="text-[11px] text-[#6B778C] font-bold pl-8">
                                                            + {ticket.assignees.length - 4} more
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-[13px] text-[#6B778C] italic">Unassigned</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Priority</label>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full",
                                            ticket.priority === "Critical" ? "bg-[#DE350B]" :
                                                ticket.priority === "High" ? "bg-[#FF8B00]" :
                                                    ticket.priority === "Medium" ? "bg-[#FFC400]" : "bg-[#00B8D9]"
                                        )} />
                                        <span className="text-[13px] text-[#172B4D] font-medium">{ticket.priority}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Start date</label>
                                    <p className="text-[13px] text-[#172B4D] font-medium">{ticket.startDate ? format(new Date(ticket.startDate), "MMM d, yyyy") : "—"}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Due date</label>
                                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setExtending(true)}>
                                        <p className={cn("text-[13px] font-bold", ticket.status === "Closed" ? "text-emerald-500" : "text-[#172B4D]")}>
                                            {ticket.endDate ? format(new Date(ticket.endDate), "MMM d, yyyy") : "—"}
                                        </p>
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <CalendarClock className="w-3.5 h-3.5 text-[#0052CC] opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">
                                                    Extend due date
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Created</label>
                                    <p className="text-[12px] text-[#6B778C] font-medium">{createdDate}</p>
                                </div>
                            </div>
                        </div>

                        {project && (
                            <div className="space-y-3 pt-6 border-t border-border">
                                <label className="text-[11px] font-bold text-[#6B778C]">Project</label>
                                <div className="flex items-center gap-2.5 p-2 bg-white border border-border rounded-[3px]">
                                    <div className="w-6 h-6 rounded-[2px] bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                        {project.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-[#172B4D] truncate">{project.name}</p>
                                        <p className="text-[11px] text-[#6B778C] truncate capitalize">{project.category || 'General'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Extend Due Date Dialog */}
                <Dialog open={extending} onOpenChange={setExtending}>
                    <DialogContent className="max-w-md rounded-[3px] p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold tracking-tight text-[#172B4D]">Extend Due Date</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[12px] font-bold text-[#42526E]">New Due Date</label>
                                    <AnimatedDatePicker
                                        value={newDueDate || ticket.endDate || ""}
                                        onChange={setNewDueDate}
                                        placeholder="Select field"
                                        triggerClassName="w-full h-10 rounded-[3px] border-border bg-white text-[14px]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[12px] font-bold text-[#42526E]">Reason for Extension</label>
                                    <textarea
                                        className="w-full min-h-[100px] rounded-[3px] border border-border bg-white p-3 text-[14px] focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none transition-all resize-none"
                                        placeholder="Provide a reason..."
                                        value={extendReason}
                                        onChange={e => setExtendReason(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={() => setExtending(false)} className="rounded-[3px] text-[14px] font-bold text-[#42526E]">Cancel</Button>
                            <Button
                                onClick={handleExtend}
                                className="rounded-[3px] bg-[#0052CC] hover:bg-[#0747A6] text-white text-[14px] font-bold px-4"
                                loading={isExtending}
                                disabled={!newDueDate || !extendReason.trim()}
                            >
                                Confirm Extension
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </>
    );
}
