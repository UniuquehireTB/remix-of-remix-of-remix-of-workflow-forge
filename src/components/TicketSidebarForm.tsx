import React from "react";
import {
    X, Check, Bug, FileText, AlertCircle,
    Calendar, Users, Send, ArrowLeft,
    Zap, CheckSquare, ArrowUpCircle, ChevronUp, ChevronDown, Equal, LifeBuoy,
    Maximize2, Minimize2, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    isSaving = false
}: TicketSidebarFormProps) {
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const [reasonPopupOpen, setReasonPopupOpen] = React.useState(false);
    const initialEndDate = React.useMemo(() => editData.endDate, [open, editData.id]);

    // We'll use a local reason state that handleSave will use if needed
    const [pendingEndDate, setPendingEndDate] = React.useState<string | null>(null);

    const ticketTypes = [
        { label: "Bug", value: "Bug", icon: <Bug className="w-3.5 h-3.5 text-[#E54937]" /> },
        { label: "Feature", value: "Feature", icon: <Zap className="w-3.5 h-3.5 text-[#6554C0]" /> },
        { label: "Task", value: "Task", icon: <CheckSquare className="w-3.5 h-3.5 text-[#4C9AFF]" /> },
        { label: "Improvement", value: "Improvement", icon: <ArrowUpCircle className="w-3.5 h-3.5 text-[#36B37E]" /> },
    ];

    const priorities = [
        { label: "Critical", value: "Critical", icon: <AlertCircle className="w-3.5 h-3.5 text-[#E54937]" /> },
        { label: "High", value: "High", icon: <ChevronUp className="w-3.5 h-3.5 text-[#FF8B00]" /> },
        { label: "Medium", value: "Medium", icon: <Equal className="w-3.5 h-3.5 text-[#FFC400]" /> },
        { label: "Low", value: "Low", icon: <ChevronDown className="w-3.5 h-3.5 text-[#36B37E]" /> },
    ];

    if (!open) return null;

    return (
        <motion.div
            layout
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
                "fixed inset-y-0 right-0 bg-white border-l border-border shadow-2xl z-[120] flex flex-col overflow-hidden transition-[width] duration-300",
                isFullScreen ? "w-[calc(100%-40px)] lg:w-[1000px]" : "w-[550px]"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-border/60 bg-white min-h-[64px] shrink-0">
                <div className="flex items-center gap-3">
                    {!isFullScreen && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={onClose}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-[18px] font-bold text-[#172B4D]">{title}</h2>
                        {subtitle && <p className="text-[11px] text-[#6B778C] font-bold mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Restore" : "Maximize"}>
                        {isFullScreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                    </Button>
                    <div className="w-px h-4 bg-border/60 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]">
                        <MoreHorizontal className="w-4.5 h-4.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar bg-white transition-all duration-300">
                <div className={cn("mx-auto space-y-8 px-8 py-10 transition-all duration-300", isFullScreen ? "max-w-none" : "max-w-xl")}>
                    <FormField
                        label={<div className="flex justify-between w-full"><span>Title</span><span className={cn("text-[10px]", (editData.title?.length || 0) > 70 ? "text-[#DE350B]" : "text-[#6B778C]")}>{editData.title?.length || 0}/80</span></div>}
                        icon={Bug} required error={errors.title} labelClassName="text-[#6B778C] font-bold text-[11px] w-full"
                    >
                        <input
                            className={cn(
                                "premium-input h-10 border-[#DFE1E6] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D]",
                                errors.title && "!border-[#DE350B] focus:ring-[#DE350B]/10"
                            )}
                            placeholder="What's the issue?"
                            maxLength={80}
                            value={editData.title || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, title: e.target.value }));
                                setErrors(p => ({ ...p, title: "" }));
                            }}
                        />
                    </FormField>

                    <FormField label="Project" icon={FileText} required labelClassName="text-[#6B778C] font-bold text-[11px]">
                        <AnimatedDropdown
                            options={projects.map(p => ({
                                label: p.name,
                                value: p.id.toString(),
                                icon: <LifeBuoy className="w-3.5 h-3.5 text-[#0052CC]" />
                            }))}
                            value={editData.projectId?.toString() || ""}
                            onChange={v => {
                                const newProjectId = v ? parseInt(v) : null;
                                const projectMembers = projects.find(p => p.id === newProjectId)?.members?.map((m: any) => m.id) || [];

                                setEditData((d: any) => ({
                                    ...d,
                                    projectId: newProjectId,
                                    assignees: newProjectId
                                        ? d.assignees?.filter((a: any) => {
                                            const id = typeof a === 'object' ? a.id : a;
                                            return projectMembers.includes(id);
                                        })
                                        : d.assignees
                                }));
                            }}
                            placeholder="Select project"
                        />
                    </FormField>

                    <FormField
                        label={<div className="flex justify-between w-full"><span>Description</span><span className={cn("text-[10px]", (editData.description?.length || 0) > 450 ? "text-[#DE350B]" : "text-[#6B778C]")}>{editData.description?.length || 0}/500</span></div>}
                        icon={FileText} required error={errors.description} labelClassName="text-[#6B778C] font-bold text-[11px] w-full"
                    >
                        <textarea
                            className={cn(
                                "premium-input min-h-[140px] resize-none border-[#DFE1E6] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D] leading-relaxed",
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

                    <div className="grid grid-cols-2 gap-6">
                        <FormField label="Type" icon={Bug} required error={errors.type} labelClassName="text-[#6B778C] font-bold text-[11px]">
                            <AnimatedDropdown
                                options={ticketTypes}
                                value={editData.type || ""}
                                onChange={v => {
                                    setEditData((d: any) => ({ ...d, type: v as any }));
                                    setErrors(p => ({ ...p, type: "" }));
                                }}
                                placeholder="Select type"
                                error={!!errors.type}
                            />
                        </FormField>
                        <FormField label="Priority" icon={AlertCircle} required error={errors.priority} labelClassName="text-[#6B778C] font-bold text-[11px]">
                            <AnimatedDropdown
                                options={priorities}
                                value={editData.priority || ""}
                                onChange={v => {
                                    setEditData((d: any) => ({ ...d, priority: v as any }));
                                    setErrors(p => ({ ...p, priority: "" }));
                                }}
                                placeholder="Select priority"
                                error={!!errors.priority}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormField label="Start date" icon={Calendar} error={errors.startDate} labelClassName="text-[#6B778C] font-bold text-[11px]">
                            <AnimatedDatePicker
                                value={editData.startDate || ""}
                                onChange={v => {
                                    setEditData((d: any) => {
                                        const hasAssigneeDate = d.assignees?.some((a: any) => typeof a === 'object' && a.joinDate);
                                        const willHaveNoDates = !v && !hasAssigneeDate;
                                        return {
                                            ...d,
                                            startDate: v,
                                            endDate: willHaveNoDates ? "" : d.endDate
                                        };
                                    });
                                }}
                                error={!!errors.startDate}
                                placeholder="Select start date"
                                showIcon={false}
                            />
                        </FormField>
                        <FormField label="Due date" icon={Calendar} error={errors.endDate} labelClassName="text-[#6B778C] font-bold text-[11px]">
                            <AnimatedDatePicker
                                value={editData.endDate || ""}
                                onChange={v => {
                                    if (isEditing && initialEndDate && v && new Date(v) > new Date(initialEndDate)) {
                                        setPendingEndDate(v);
                                        setReasonPopupOpen(true);
                                    } else {
                                        setEditData((d: any) => ({ ...d, endDate: v }));
                                    }
                                }}
                                error={!!errors.endDate}
                                disabled={!editData.startDate && !editData.assignees?.some((a: any) => typeof a === 'object' && a.joinDate)}
                                placeholder={(!editData.startDate && !editData.assignees?.some((a: any) => typeof a === 'object' && a.joinDate)) ? "Pick start date first" : "Select due date"}
                                showIcon={false}
                            />
                        </FormField>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/40">
                        <MemberSelector
                            label="Assignees"
                            icon={Users}
                            selected={editData.assignees || []}
                            startDate={editData.startDate}
                            endDate={editData.endDate}
                            onChange={val => {
                                setEditData((d: any) => {
                                    const hasAssigneeDate = val.some(a => typeof a === 'object' && a.joinDate);
                                    const willHaveNoDates = !d.startDate && !hasAssigneeDate;
                                    return {
                                        ...d,
                                        assignees: val,
                                        endDate: willHaveNoDates ? "" : d.endDate
                                    };
                                });
                            }}
                            showSelf={true}
                            showTeam={true}
                            allowedMemberIds={
                                editData.projectId
                                    ? (projects.find(p => p.id === editData.projectId)?.members?.map((m: any) => m.id) ?? undefined)
                                    : undefined
                            }
                            error={errors.assignees}
                            labelClassName="text-[#6B778C] font-bold text-[11px]"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-border bg-white flex justify-end gap-3 shrink-0">
                <Button variant="ghost" className="h-10 px-6 rounded-[3px] font-bold text-[#42526E] hover:bg-[#F4F5F7]" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={onSave}
                    loading={isSaving}
                    className="h-10 px-8 rounded-[3px] bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold shadow-none transition-all flex items-center gap-2"
                >
                    <Check className="w-4 h-4" />
                    {isEditing ? "Save changes" : "Create ticket"}
                </Button>
            </div>
            <Dialog open={reasonPopupOpen} onOpenChange={setReasonPopupOpen}>
                <DialogContent className="max-w-md rounded-[3px] border border-[#FFEBE6] bg-white shadow-2xl p-0 overflow-hidden z-[200]">
                    <DialogHeader className="px-6 py-5 border-b border-[#FFEBE6] bg-white text-left">
                        <DialogTitle className="text-[18px] font-bold text-[#172B4D] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[3px] bg-[#FFEBE6] flex items-center justify-center border border-[#FFBDAD]/30">
                                <AlertCircle className="w-5 h-5 text-[#DE350B]" />
                            </div>
                            Extension Reason
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-6 space-y-4">
                        <p className="text-[14px] text-[#42526E] leading-relaxed">
                            You are extending the due date. Please provide a brief reason for tracking.
                        </p>
                        <textarea
                            className="premium-input min-h-[120px] p-4 text-[14px] resize-none rounded-[3px] bg-[#FAFBFC] border-[#DFE1E6]"
                            placeholder="Why is it being extended?"
                            autoFocus
                            value={editData.extendReason || ""}
                            onChange={e => setEditData((d: any) => ({ ...d, extendReason: e.target.value }))}
                        />
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-[#FFEBE6] gap-3 bg-[#FAFBFC]">
                        <Button variant="ghost" className="rounded-[3px] font-bold text-[#42526E] hover:bg-[#EBECF0] h-9 px-6 text-[13px]" onClick={() => {
                            setReasonPopupOpen(false);
                            setPendingEndDate(null);
                        }}>Cancel</Button>
                        <Button
                            className="rounded-[3px] bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold h-9 px-6 text-[13px] shadow-none"
                            disabled={!editData.extendReason?.trim()}
                            onClick={() => {
                                setEditData((d: any) => ({ ...d, endDate: pendingEndDate }));
                                setReasonPopupOpen(false);
                                setPendingEndDate(null);
                            }}
                        >
                            Confirm Extension
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
