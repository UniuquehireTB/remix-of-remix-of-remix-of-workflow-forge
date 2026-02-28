import React from "react";
import {
    X, FolderKanban, Building2, FileText, Users, Pencil, Trash2,
    CheckCircle2, Activity, Calendar,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";

import { ticketService } from "@/services/authService";

interface ProjectDetailViewProps {
    project: any;
    onClose: () => void;
    onEdit: (project: any) => void;
    onDelete: (project: any) => void;
}

export function ProjectDetailView({
    project,
    onClose,
    onEdit,
    onDelete
}: ProjectDetailViewProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [stats, setStats] = React.useState<any>({
        'Open': 0,
        'In Progress': 0,
        'On Hold': 0,
        'Closed': 0,
        'total': 0
    });

    React.useEffect(() => {
        if (project?.id) {
            ticketService.getStats(project.id)
                .then((data: any) => setStats(data))
                .catch(err => console.error("Error fetching project ticket stats:", err));
        }
    }, [project?.id]);

    if (!project) return null;

    const createdDate = project.createdAt ? formatDistanceToNow(new Date(project.createdAt)) + " ago" : "—";

    const formatCount = (count: number) => count.toString().padStart(2, '0');

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[500px] bg-background border-l border-border shadow-2xl z-[110] flex flex-col overflow-hidden"
        >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/20">
                        <FolderKanban className="w-5.5 h-5.5" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-none mb-1.5">Project Details</h2>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-extrabold text-foreground tracking-tight">{project.client}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onEdit(project)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-bold text-[10px] capitalize">Edit Project</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => onDelete(project)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-bold text-[10px] capitalize">Delete Project</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="w-px h-5 bg-border/60 mx-1.5" />

                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted transition-all" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-5 px-6 space-y-6">
                {/* Title & Description */}
                <div className="space-y-2">
                    <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                        {project.name}
                    </h1>
                    <div className="relative">
                        <p className={cn(
                            "text-[13px] text-muted-foreground leading-relaxed transition-all duration-300",
                            !isExpanded && (project.description?.length || 0) > 300 && "line-clamp-[4]"
                        )}>
                            {project.description || "No description provided."}
                        </p>
                        {(project.description?.length || 0) > 300 && (
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
                    <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60 h-14">
                        <div className="p-2 px-3.5 space-y-0.5 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Client</label>
                            <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary/60" />
                                <span className="text-[12px] font-semibold text-foreground/80">{project.client}</span>
                            </div>
                        </div>

                        <div className="p-2 px-3.5 space-y-0.5 flex flex-col justify-center bg-muted/10">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">ID & Created</label>
                            <div className="text-[11px] font-semibold text-foreground/70 truncate flex items-center gap-1.5">
                                <span className="bg-primary/10 text-primary px-1 rounded-sm text-[9px] font-black">{project.projectCode}</span>
                                <span className="text-muted-foreground/40 text-[10px]">•</span>
                                {createdDate}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60 h-12">
                        <div className="p-2 px-3.5 space-y-0 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Total Members</label>
                            <div className="text-[12px] font-semibold text-foreground/80 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-primary" />
                                {project.members?.length || 0} Members
                            </div>
                        </div>

                        <div className="p-2 px-3.5 space-y-0 flex flex-col justify-center">
                            <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Recent Activity</label>
                            <div className="text-[12px] font-semibold text-foreground/80 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                Active
                            </div>
                        </div>
                    </div>

                    {/* Members Row */}
                    <div className="p-3 px-3.5 space-y-2 bg-background/50">
                        <label className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Project Collaboration Team</label>
                        <div className="flex flex-wrap gap-1.5">
                            {project.members && project.members.length > 0 ? (
                                <TooltipProvider delayDuration={0}>
                                    {project.members.map((m: any, i: number) => (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1.5 bg-muted/30 border border-border/20 rounded-md pr-2 py-0.5 transition-colors cursor-help group">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border border-primary/20 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                        {m.username?.slice(0, 1).toUpperCase() || "U"}
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{m.username}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-xl mb-1">
                                                <p className="text-[11px] font-bold text-slate-800">{m.username}</p>
                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight">{m.role || "Member"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </TooltipProvider>
                            ) : (
                                <span className="text-[11px] font-semibold text-muted-foreground/40 italic">No members assigned yet.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ticket Analytics / Summary */}
                <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[12px] font-bold capitalize text-muted-foreground/80 tracking-tight">Ticket System Pulse</h3>
                        <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold capitalize px-2 py-0.5 border border-primary/10">
                            Real-time
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:border-slate-300 group">
                            <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-600 border border-slate-500/10 group-hover:bg-slate-500 group-hover:text-white transition-all">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground capitalize leading-none mb-1">Open</p>
                                <p className="text-base font-bold text-foreground tracking-tight">{stats['Open'] || 0}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:border-primary/20 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground capitalize leading-none mb-1">In Progress</p>
                                <p className="text-base font-bold text-foreground tracking-tight">{stats['In Progress'] || 0}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:border-amber-500/20 group">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground capitalize leading-none mb-1">On Hold</p>
                                <p className="text-base font-bold text-foreground tracking-tight">{stats['On Hold'] || 0}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:border-emerald-500/20 group">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground capitalize leading-none mb-1">Closed</p>
                                <p className="text-base font-bold text-foreground tracking-tight">{stats['Closed'] || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-border bg-background mt-auto flex gap-3">
                <Button variant="outline" className="flex-1 h-10 rounded-xl font-bold text-sm" onClick={onClose}>
                    Close
                </Button>
                <Button className="flex-1 h-10 rounded-xl font-bold text-sm shadow-lg shadow-primary/20" onClick={() => onEdit(project)}>
                    Edit Project
                </Button>
            </div>
        </motion.div>
    );
}
