import React from "react";
import {
    X, Check, Bug, FileText, AlertCircle,
    Calendar, Users, Send, ArrowLeft,
    Zap, CheckSquare, ArrowUpCircle, ChevronUp, ChevronDown, Equal, LifeBuoy,
    Maximize2, Minimize2, MoreHorizontal, Minus,
    Plus, Activity, LayoutList, CheckCircle2, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FormField } from "@/components/FormField";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { AnimatedDatePicker } from "@/components/AnimatedDatePicker";
import { MemberSelector } from "@/components/MemberSelector";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { authService } from "@/services/authService";

interface TicketSidebarFormProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    onSave: () => void;
    editData: any;
    setEditData: React.Dispatch<React.SetStateAction<any>>;
    projects: any[];
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    isEditing: boolean;
    isSaving?: boolean;
    isMinimized?: boolean;
    onMinimize?: (minimized: boolean) => void;
}

export function TicketSidebarForm({
    open,
    onClose,
    title,
    subtitle,
    onSave,
    editData,
    setEditData,
    projects,
    errors,
    setErrors,
    isEditing,
    isSaving = false,
    isMinimized = false,
    onMinimize
}: TicketSidebarFormProps) {
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const [reasonPopupOpen, setReasonPopupOpen] = React.useState(false);
    const [pendingEndDate, setPendingEndDate] = React.useState<string | null>(null);
    const [draftReason, setDraftReason] = React.useState("");
    const [members, setMembers] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!editData.projectId && projects.length > 0) {
            setEditData((d: any) => ({ ...d, projectId: projects[0].id }));
        }
    }, [projects, editData.projectId, setEditData]);

    React.useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await authService.getMembersList();
                setMembers(data);
            } catch (err) {
                console.error("Failed to load members", err);
            }
        };
        fetchMembers();
    }, []);

    const ticketTypes = [
        { label: "Bug", value: "Bug", icon: <Bug className="w-3.5 h-3.5 text-[#BF2600]" /> },
        { label: "Feature", value: "Feature", icon: <Activity className="w-3.5 h-3.5 text-[#403294]" /> },
        { label: "Improvement", value: "Improvement", icon: <LayoutList className="w-3.5 h-3.5 text-[#0052CC]" /> },
        { label: "Task", value: "Task", icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#006644]" /> },
    ];

    const currentTypeIcon = ticketTypes.find(t => t.value === editData.type)?.icon || (editData.id ? <Bug className="w-4 h-4 text-[#0052CC]" /> : <Plus className="w-4 h-4 text-[#0052CC]" />);

    if (!open) return null;

    return (
        <motion.div
            layout
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
                "fixed bg-white shadow-2xl z-[120] flex flex-col overflow-hidden transition-[width,height,bottom,right] duration-300",
                isMinimized
                    ? "bottom-4 right-4 w-[400px] h-14 rounded-lg border border-border cursor-pointer hover:bg-[#F4F5F7]"
                    : cn(
                        "inset-y-0 right-0 border-l border-border",
                        isFullScreen ? "w-[calc(100%-40px)] lg:w-[1000px]" : "w-[550px]"
                    )
            )}
            onClick={() => isMinimized && onMinimize?.(false)}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center justify-between px-5 bg-white shrink-0",
                isMinimized ? "h-full" : "py-4 border-b border-border/60 min-h-[64px]"
            )}>
                <div className="flex items-center gap-4 min-w-0">
                    {!isMinimized && (
                        <div className="shrink-0">
                            {React.cloneElement(currentTypeIcon as React.ReactElement, { className: "w-5 h-5" })}
                        </div>
                    )}
                    <div className="truncate">
                        <h2 className={cn(
                            "font-bold text-[#172B4D] truncate",
                            isMinimized ? "text-[14px]" : "text-[18px]"
                        )}>
                            {!isEditing && !editData.title ? `New ${editData.type?.toLowerCase() || 'ticket'}` : (editData.title || title)}
                        </h2>
                        {subtitle && !isMinimized && <p className="text-[11px] text-[#6B778C] font-bold mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <TooltipProvider>
                        {!isMinimized && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-[3px] text-[#42526E]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsFullScreen(!isFullScreen);
                                        }}
                                    >
                                        {isFullScreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2">{isFullScreen ? "Restore" : "Maximize"}</TooltipContent>
                            </Tooltip>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-[3px] text-[#42526E]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMinimize?.(!isMinimized);
                                    }}
                                >
                                    {isMinimized ? <Maximize2 className="w-4.5 h-4.5" /> : <Minus className="w-4.5 h-4.5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2 font-bold">{isMinimized ? "Expand" : "Minimize"}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-[3px] text-[#42526E] transition-all",
                                        isMinimized && "bg-[#EAE6FF] text-[#0052CC] hover:bg-[#DED9FF]"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                >
                                    <X className="w-4.5 h-4.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs bg-[#172B4D] text-white border-none py-1.5 px-2 font-bold">Close</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto premium-scrollbar bg-white transition-all duration-300">
                        <div className={cn("mx-auto space-y-7 px-6 py-8 transition-all duration-300", isFullScreen ? "max-w-none" : "max-w-xl")}>
                            {/* Required fields notice */}
                            <p className="text-[13px] text-[#42526E] mb-6 font-medium">
                                Required fields are marked with an asterisk <span className="text-[#DE350B]">*</span>
                            </p>

                            <FormField
                                label="Project"
                                labelClassName="text-[#44546F] font-semibold text-[13px]"
                            >
                                <AnimatedDropdown
                                    options={projects.map(p => ({
                                        label: p.name,
                                        value: p.id.toString(),
                                        icon: (
                                            <div className="w-5 h-5 rounded-[3px] bg-[#0052CC] flex items-center justify-center text-white shrink-0 shadow-sm">
                                                <span className="text-[10px] font-bold">{(p.projectCode || p.name).slice(0, 2).toUpperCase()}</span>
                                            </div>
                                        )
                                    }))}
                                    value={editData.projectId?.toString() || ""}
                                    onChange={v => {
                                        const newProjectId = v ? parseInt(v) : null;
                                        setEditData((d: any) => ({ ...d, projectId: newProjectId }));
                                    }}
                                    placeholder="Select project"
                                />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Work type"
                                    labelClassName="text-[#44546F] font-semibold text-[13px]"
                                >
                                    <AnimatedDropdown
                                        options={ticketTypes}
                                        value={editData.type || ""}
                                        onChange={v => setEditData((d: any) => ({ ...d, type: v }))}
                                        placeholder="Select Type"
                                    />
                                </FormField>

                                <FormField
                                    label="Priority"
                                    labelClassName="text-[#44546F] font-semibold text-[13px]"
                                >
                                    <AnimatedDropdown
                                        options={[
                                            { label: "Low", value: "Low", icon: <div className="w-2 h-2 rounded-full bg-[#00B8D9]" /> },
                                            { label: "Medium", value: "Medium", icon: <div className="w-2 h-2 rounded-full bg-[#FFC400]" /> },
                                            { label: "High", value: "High", icon: <div className="w-2 h-2 rounded-full bg-[#FF8B00]" /> },
                                            { label: "Critical", value: "Critical", icon: <div className="w-2 h-2 rounded-full bg-[#DE350B]" /> },
                                        ]}
                                        value={editData.priority || ""}
                                        onChange={v => setEditData((d: any) => ({ ...d, priority: v }))}
                                        placeholder="Select Priority"
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Summary"
                                required
                                error={errors.title}
                                labelClassName="text-[#44546F] font-semibold text-[13px]"
                            >
                                <input
                                    className={cn(
                                        "w-full px-3 h-[40px] border rounded-[3px] bg-white text-[14px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 text-[#172B4D] placeholder:text-[#6B778C]/50",
                                        errors.title
                                            ? "border-[#DE350B] focus:ring-[#DE350B]/10"
                                            : "border-[#A5ADBA] focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] hover:bg-[#F4F5F7]"
                                    )}
                                    placeholder="Summarize the issue"
                                    maxLength={80}
                                    value={editData.title || ""}
                                    onChange={e => {
                                        setEditData((d: any) => ({ ...d, title: e.target.value }));
                                        setErrors(p => ({ ...p, title: "" }));
                                    }}
                                />
                            </FormField>

                            <FormField
                                label="Description"
                                error={errors.description}
                                labelClassName="text-[#44546F] font-semibold text-[13px]"
                            >
                                <textarea
                                    className={cn(
                                        "premium-input min-h-[140px] resize-none border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D] leading-relaxed p-4",
                                        errors.description && "!border-[#DE350B] focus:ring-[#DE350B]/10"
                                    )}
                                    placeholder="Describe the issue in detail..."
                                    rows={4}
                                    maxLength={500}
                                    value={editData.description || ""}
                                    onChange={e => {
                                        setEditData((d: any) => ({ ...d, description: e.target.value }));
                                        setErrors(p => ({ ...p, description: "" }));
                                    }}
                                />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Start Date" labelClassName="text-[#44546F] font-semibold text-[13px]">
                                    <AnimatedDatePicker
                                        value={editData.startDate || ""}
                                        onChange={v => setEditData((d: any) => ({ ...d, startDate: v }))}
                                        className="w-full"
                                        clearable
                                        triggerClassName="h-[40px] w-full border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF]"
                                    />
                                </FormField>

                                <FormField label="Due Date" error={errors.endDate} labelClassName="text-[#44546F] font-semibold text-[13px]">
                                    <div className="relative group">
                                        <AnimatedDatePicker
                                            value={editData.endDate || ""}
                                            onChange={v => {
                                                // Only show reason popup if we're EDITING and the date actually CHANGES from a non-empty value
                                                if (isEditing && editData.endDate && v !== editData.endDate) {
                                                    setPendingEndDate(v);
                                                    setReasonPopupOpen(true);
                                                } else {
                                                    setEditData((d: any) => ({ ...d, endDate: v }));
                                                    setErrors(p => ({ ...p, endDate: "" }));
                                                }
                                            }}
                                            className="w-full"
                                            clearable
                                            triggerClassName={cn(
                                                "h-[40px] w-full border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF]",
                                                errors.endDate && "border-[#DE350B]"
                                            )}
                                        />

                                        <AnimatePresence>
                                            {reasonPopupOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute bottom-full mb-2 right-0 w-[420px] bg-white border border-[#DFE1E6] shadow-[0_8px_24px_rgba(23,43,77,0.12)] p-6 z-[200] rounded-[3px]"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 rounded-[3px] bg-[#FFEBE6] flex items-center justify-center shrink-0">
                                                                <AlertCircle className="w-5 h-5 text-[#DE350B]" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-[14px] font-bold text-[#172B4D]">Reason for extension</h4>
                                                                <p className="text-[12px] text-[#6B778C] font-medium">This modification will be logged in the history.</p>
                                                            </div>
                                                        </div>

                                                        <textarea
                                                            placeholder="Why are you changing the due date?"
                                                            className="w-full px-3 py-2 border border-[#A5ADBA] rounded-[3px] bg-white text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/10 focus:border-[#4C9AFF] min-h-[100px] p-3 text-[14px] resize-none"
                                                            autoFocus
                                                            value={draftReason}
                                                            onChange={(e) => setDraftReason(e.target.value)}
                                                        />

                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 text-[12px] font-bold text-[#42526E]"
                                                                onClick={() => {
                                                                    setReasonPopupOpen(false);
                                                                    setPendingEndDate(null);
                                                                    setDraftReason("");
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                className="h-8 px-4 bg-[#0052CC] hover:bg-[#0747A6] text-white text-[12px] font-bold rounded-[3px] shadow-sm"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();

                                                                    // Update editing data with the new due date and reason
                                                                    setEditData((prev: any) => ({
                                                                        ...prev,
                                                                        endDate: pendingEndDate,
                                                                        extendReason: draftReason
                                                                    }));

                                                                    // Reset local popup states
                                                                    setReasonPopupOpen(false);
                                                                    setPendingEndDate(null);
                                                                    setDraftReason("");
                                                                    setErrors((prev: any) => ({ ...prev, endDate: "" }));
                                                                }}
                                                            >
                                                                Confirm Change
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </FormField>
                            </div>

                            <FormField label="Assignees" labelClassName="text-[#44546F] font-semibold text-[13px]">
                                <MemberSelector
                                    selected={editData.assignees || []}
                                    onChange={(assignees) => {
                                        setEditData((d: any) => ({ ...d, assignees }));
                                        setErrors(p => {
                                            const { assignees: _, ...rest } = p;
                                            return rest;
                                        });
                                    }}
                                    allowedMemberIds={editData.projectId ? projects.find(p => p.id === editData.projectId)?.members?.map((m: any) => m.id) : undefined}
                                    variant="tickets"
                                    startDate={editData.startDate}
                                    endDate={editData.endDate}
                                    error={errors.assignees}
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border/60 bg-[#FAFBFC] shrink-0 flex items-center justify-end gap-2 px-6">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-9 font-bold text-[#42526E] hover:bg-transparent hover:text-[#172B4D] px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isSaving}
                            className="h-9 px-8 bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold rounded-[3px] shadow-sm min-w-[120px]"
                        >
                            {isSaving ? "Saving..." : (isEditing ? "Save" : "Create")}
                        </Button>
                    </div>
                </>
            )}
        </motion.div>
    );
}