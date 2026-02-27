import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
    X, Check, Shield, User, Calendar, Clock,
    MessageSquare, Activity, Send, AlertCircle,
    MoreHorizontal, ChevronDown, CheckCircle2, Clock3,
    Pencil, Trash2,
    Users
} from "lucide-react";
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

interface TicketDetailViewProps {
    ticket: any;
    projects: any[];
    onClose: () => void;
    onUpdateStatus: (id: number, status: string) => void;
    onEdit: (ticket: any) => void;
    onDelete: (ticket: any) => void;
}

export function TicketDetailView({
    ticket,
    projects,
    onClose,
    onUpdateStatus,
    onEdit,
    onDelete
}: TicketDetailViewProps) {
    const [comments, setComments] = React.useState<any[]>([]);
    const [comment, setComment] = React.useState("");
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [sending, setSending] = React.useState(false);
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
        }
    }, [ticket?.id]);

    const handleSendComment = async () => {
        if (!comment.trim() || sending) return;
        setSending(true);
        try {
            await commentService.create(ticket.id, comment);
            setComment("");
            fetchComments();
        } catch (err) {
            toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    if (!ticket) return null;

    const project = projects.find(p => p.id === ticket.projectId);
    const createdDate = ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt)) + " ago" : "—";

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[500px] bg-background border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-muted hover:bg-muted text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {ticket.ticketId}
                    </Badge>
                    <span className={cn("text-[10px] font-bold px-3 py-0.5 rounded-full border whitespace-nowrap uppercase tracking-wider",
                        ticket.type === "Bug" ? "bg-red-50 text-red-500 border-red-100" :
                            ticket.type === "Feature" ? "bg-blue-50 text-blue-500 border-blue-100" :
                                ticket.type === "Task" ? "bg-slate-50 text-slate-500 border-slate-100" :
                                    "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                        {ticket.type}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-amber-500/10 hover:text-amber-600 transition-colors">
                                            <AlertCircle className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-xs font-bold">Update Status</p></TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-xl border-border/60">
                                {["Open", "In Progress", "On Hold", "Closed"].map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() => onUpdateStatus(ticket.id, status)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors",
                                            ticket.status === status ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                            status === "Closed" ? "bg-emerald-500" :
                                                status === "In Progress" ? "bg-blue-500" :
                                                    status === "On Hold" ? "bg-amber-500" : "bg-slate-300"
                                        )} />
                                        {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-4 bg-border/60 mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => onEdit(ticket)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs font-bold">Edit Ticket</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => onDelete(ticket)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs font-bold">Delete Ticket</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="w-px h-4 bg-border/60 mx-1" />

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-5 px-6 space-y-4">
                {/* Title & Description */}
                <div className="space-y-1">
                    <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
                        {ticket.title}
                    </h1>
                    <div className="relative">
                        <p className={cn(
                            "text-[13px] text-muted-foreground leading-relaxed transition-all duration-300",
                            !isExpanded && ticket.description?.length > 300 && "line-clamp-[4]"
                        )}>
                            {ticket.description || "No description provided."}
                        </p>
                        {ticket.description?.length > 300 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[11px] font-bold text-primary hover:underline mt-1 focus:outline-none"
                            >
                                {isExpanded ? "Show Less" : "Show More"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified High-Density Specs Grid */}
                <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/5">
                    {/* Primary Info Row */}
                    <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 h-14">
                        <div className="p-2 px-3.5 space-y-0.5 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Status</label>
                            <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                    ticket.status === "Closed" ? "bg-emerald-500" :
                                        ticket.status === "In Progress" ? "bg-blue-500" :
                                            ticket.status === "On Hold" ? "bg-amber-500" : "bg-slate-300"
                                )} />
                                <span className="text-[12px] font-semibold text-foreground/80">{ticket.status}</span>
                            </div>
                        </div>

                        <div className="p-2 px-3.5 space-y-0.5 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Priority</label>
                            <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                    ticket.priority === "Critical" ? "bg-red-500" :
                                        ticket.priority === "High" ? "bg-orange-500" :
                                            ticket.priority === "Medium" ? "bg-amber-400" : "bg-blue-400"
                                )} />
                                <span className="text-[12px] font-semibold text-foreground/80">{ticket.priority}</span>
                            </div>
                        </div>

                        <div className="p-2 px-3.5 space-y-0.5 flex flex-col justify-center bg-muted/10">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Created</label>
                            <div className="text-[11px] font-semibold text-foreground/70 truncate">
                                {createdDate}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Row */}
                    <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60 h-12">
                        <div className="p-2 px-3.5 space-y-0 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Start Date</label>
                            <div className="text-[12px] font-semibold text-foreground/80">
                                {ticket.startDate ? format(new Date(ticket.startDate), "MMM d, yyyy") : "—"}
                            </div>
                        </div>

                        <div className="p-2 px-3.5 space-y-0 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Due Date</label>
                            <div className="text-[12px] font-semibold text-foreground/80">
                                {ticket.endDate ? format(new Date(ticket.endDate), "MMM d, yyyy") : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Assignees Row */}
                    <div className="p-2 px-3.5 space-y-1.5 bg-background/50">
                        <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Assignees</label>
                        <div className="flex flex-wrap gap-1.5">
                            {ticket.assignees && ticket.assignees.length > 0 ? (
                                <TooltipProvider delayDuration={0}>
                                    {ticket.assignees.map((a: any, i: number) => {
                                        const joinDate = a.TicketAssignee?.joinDate || a.joinDate;
                                        const isMe = Number(a.id) === Number(currentUser?.id);
                                        return (
                                            <Tooltip key={i}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 bg-muted/30 border border-border/20 rounded-md pr-2 py-0.5 transition-colors cursor-help group">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border transition-colors",
                                                            isMe ? "bg-primary text-white border-primary" : "bg-primary/10 text-primary border-slate-300 group-hover:border-primary/40"
                                                        )}>
                                                            {a.username?.slice(0, 1).toUpperCase() || "U"}
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{a.username}</span>
                                                        {joinDate && (
                                                            <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap border-l border-slate-200 pl-1.5 flex items-center gap-1">
                                                                <span className="text-[9px] opacity-70">Joined</span>
                                                                {format(new Date(joinDate), "MMM d")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-xl mb-1">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-bold text-slate-800">{a.username}</p>
                                                        {joinDate && (
                                                            <p className="text-[10px] font-semibold text-slate-500">
                                                                Joined on {format(new Date(joinDate), "MMMM d, yyyy")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </TooltipProvider>
                            ) : (
                                <span className="text-[11px] font-semibold text-muted-foreground/40 italic">Unassigned</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Tabs: Comments only */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-6 border-b border-border/40">
                        <div className="pb-3 text-sm font-bold transition-all relative flex items-center gap-2 text-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span>Comments ({comments.length})</span>
                            <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        </div>
                    </div>

                    {comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex gap-3"
                                >
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-[1.5px] border-slate-300 hover:border-primary/40 transition-colors cursor-help">
                                                    <span className="text-[11px] font-bold text-primary">
                                                        {c.user?.username?.slice(0, 1).toUpperCase()}
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-white text-slate-600 border border-slate-200 py-1.5 px-3 text-[11px] font-bold rounded-lg shadow-xl mb-1">
                                                <p>{c.user?.username}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs font-bold text-slate-700">{c.user?.username}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formatDistanceToNow(new Date(c.createdAt))} ago
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-200">
                                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                                {c.content}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="min-h-[100px] flex flex-col items-center justify-center text-muted-foreground/40 italic py-8">
                            <MessageSquare className="w-8 h-8 mb-2 opacity-10" />
                            <p className="text-xs">No comments yet.</p>
                        </div>
                    )}
                </div>
            </div>




            {/* Footer / Comment Input */}
            <div className="p-4 border-t border-border bg-background">
                <div className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            placeholder="Add a comment..."
                            className="w-full bg-muted/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all pr-12"
                            disabled={sending}
                        />
                    </div>
                    <Button
                        size="icon"
                        onClick={handleSendComment}
                        disabled={sending || !comment.trim()}
                        className="h-10 w-10 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                        <Send className={cn("w-4.5 h-4.5 text-white", sending && "animate-pulse")} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
