import React from "react";
import {
    X, FolderKanban, Building2, FileText, Users, Pencil, Trash2,
    CheckCircle2, Activity, Calendar,
    Clock, LifeBuoy, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";

import { ticketService, authService, projectService } from "@/services/authService";

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

    const currentUser = authService.getCurrentUser();
    // Only the project CREATOR can edit/delete — no role bypass
    const isOwner = currentUser?.id === project?.createdBy;
    const canManage = isOwner;
    // A non-owner who is a member can leave the project
    const isMember = !isOwner && project?.members?.some((m: any) => String(m.id) === String(currentUser?.id));
    const [isLeaving, setIsLeaving] = React.useState(false);

    const handleLeave = async () => {
        if (!project?.id || isLeaving) return;
        setIsLeaving(true);
        try {
            await projectService.leave(project.id);
            window.dispatchEvent(new CustomEvent('projects:refresh'));
            onClose();
        } catch (err) {
            console.error('Failed to leave project', err);
        } finally {
            setIsLeaving(false);
        }
    };

    React.useEffect(() => {
        if (project?.id) {
            ticketService.getStats(project.id)
                .then((data: any) => setStats(data))
                .catch(err => console.error("Error fetching project ticket stats:", err));
        }
    }, [project?.id]);

    if (!project) return null;

    const createdDate = project.createdAt ? formatDistanceToNow(new Date(project.createdAt)) + " ago" : "—";

    const formatCount = (count: number) => count.toString();

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[550px] bg-white border-l border-border shadow-2xl z-[110] flex flex-col overflow-hidden"
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-white min-h-[56px] shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[12px] font-bold text-[#42526E]">
                        Project Details
                    </span>
                    <div className="w-px h-4 bg-border/60" />
                    <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-[2px] border border-[#B3D4FF] bg-[#DEEBFF] text-[#0052CC]">
                        {project.projectCode || "N/A"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {canManage && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] hover:bg-[#F4F5F7] text-[#42526E]" onClick={() => onEdit(project)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] hover:bg-[#FFEBE6] hover:text-[#BF2600] text-[#42526E]" onClick={() => onDelete(project)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">Delete</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] ml-1 text-[#42526E]" onClick={onClose}>
                        <X className="w-4.5 h-4.5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Scrollable Column (Main Info) */}
                <div className="flex-1 overflow-y-auto premium-scrollbar bg-white">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D] leading-tight break-words">
                                {project.name}
                            </h1>

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-[#42526E]">Description</label>
                                <div className="relative group">
                                    <div className={cn(
                                        "text-[14px] text-[#172B4D] leading-relaxed break-words whitespace-pre-wrap p-3 rounded-[3px] border border-transparent transition-all",
                                        !isExpanded && (project.description?.length || 0) > 300 && "line-clamp-[6]",
                                        "hover:bg-[#F4F5F7] hover:border-border cursor-text"
                                    )}>
                                        {project.description || "No description provided."}
                                    </div>
                                    {(project.description?.length || 0) > 300 && (
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

                        {/* Recent Activity / Ticket Stats */}
                        <div className="space-y-3">
                            <h2 className="text-[12px] font-bold text-[#42526E]">Ticket summary</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Open', count: stats['Open'], color: '#42526E', bg: '#F4F5F7' },
                                    { label: 'In Progress', count: stats['In Progress'], color: '#0052CC', bg: '#DEEBFF' },
                                    { label: 'On Hold', count: stats['On Hold'], color: '#BF2600', bg: '#FFEBE6' },
                                    { label: 'Closed', count: stats['Closed'], color: '#006644', bg: '#E3FCEF' }
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center justify-between p-2.5 rounded-[3px] border border-border bg-[#F4F5F7]/30 hover:bg-[#F4F5F7] transition-colors cursor-default">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-5 h-5 rounded-[2px] flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                            </div>
                                            <span className="text-[13px] font-medium text-[#42526E]">{s.label}</span>
                                        </div>
                                        <span className="text-[13px] font-bold text-[#172B4D]">{formatCount(s.count || 0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Project Team */}
                        <div className="space-y-4 pt-4">
                            <h2 className="text-[12px] font-bold text-[#42526E]">Project team</h2>
                            <div className="space-y-3">
                                {project.members?.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-[3px] hover:bg-[#F4F5F7] transition-all group">
                                        <div className="w-8 h-8 rounded-[3px] bg-[#0052CC] flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-[14px]">
                                            {m.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-bold text-[#172B4D] truncate group-hover:text-[#0052CC] transition-colors">{m.username}</p>
                                            <p className="text-[12px] text-[#6B778C] truncate font-medium capitalize">{m.role || 'Member'}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!project.members || project.members.length === 0) && (
                                    <p className="text-[13px] text-[#6B778C] italic px-2">No members assigned.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fields Sidebar Column */}
                <div className="w-[200px] shrink-0 border-l border-border bg-[#F4F5F7] p-6 space-y-8 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-[12px] font-bold text-[#42526E] border-b border-border pb-2">Details</h2>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Client</label>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-[#6B778C]" />
                                        <span className="text-[13px] text-[#172B4D] font-medium truncate">{project.client}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Status</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#006644]" />
                                        <span className="text-[13px] text-[#172B4D] font-medium">Active</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Project key</label>
                                    <p className="text-[13px] text-[#172B4D] font-medium">{project.projectCode || "N/A"}</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#6B778C]">Created</label>
                                    <p className="text-[12px] text-[#6B778C] font-medium">{createdDate}</p>
                                </div>
                            </div>
                        </div>

                        {canManage && (
                            <div className="pt-6 border-t border-border">
                                <Button
                                    onClick={() => onEdit(project)}
                                    className="w-full rounded-[3px] bg-white border border-border text-[#42526E] hover:bg-[#EBECF0] h-9 text-[13px] font-bold shadow-none"
                                >
                                    Edit Project
                                </Button>
                            </div>
                        )}

                        {isMember && (
                            <div className="pt-6 border-t border-border">
                                <Button
                                    onClick={handleLeave}
                                    loading={isLeaving}
                                    className="w-full rounded-[3px] bg-[#FFEBE6] border border-[#FF8F73]/40 text-[#DE350B] hover:bg-[#FFBDAD] h-9 text-[13px] font-bold shadow-none flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Leave Project
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
