import React from "react";
import {
    X, Check, Bug, FileText, AlertCircle,
    Calendar, Users, Send, ArrowLeft
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
    isEditing
}: TicketSidebarFormProps) {
    const [reasonPopupOpen, setReasonPopupOpen] = React.useState(false);
    const initialEndDate = React.useMemo(() => editData.endDate, [open, editData.id]);

    // We'll use a local reason state that handleSave will use if needed
    const [pendingEndDate, setPendingEndDate] = React.useState<string | null>(null);

    const allTypes = ["Bug", "Feature", "Improvement", "Task"];
    const allPriorities = ["Low", "Medium", "High", "Critical"];

    if (!open) return null;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[500px] bg-background border-l border-border shadow-2xl z-[120] flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
                        {subtitle && <p className="text-[10px] text-muted-foreground font-bold">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <FormField label="Title" icon={Bug} required error={errors.title}>
                        <input
                            className={cn("premium-input", errors.title && "!border-destructive focus:ring-destructive/20")}
                            placeholder="What's the issue?"
                            value={editData.title || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, title: e.target.value }));
                                setErrors(p => ({ ...p, title: "" }));
                            }}
                        />
                    </FormField>

                    <FormField label="Project" icon={FileText} required>
                        <AnimatedDropdown
                            options={projects.map(p => ({ label: p.name, value: p.id.toString() }))}
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
                            triggerClassName="h-11 bg-muted/20 border-border/60 hover:border-primary/40 focus:border-primary transition-all rounded-xl"
                        />
                    </FormField>

                    <FormField label="Description" icon={FileText} required error={errors.description}>
                        <textarea
                            className={cn("premium-input min-h-[120px] resize-none", errors.description && "!border-destructive focus:ring-destructive/20")}
                            placeholder="Describe the issue in detail..."
                            rows={4}
                            value={editData.description || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, description: e.target.value }));
                                setErrors(p => ({ ...p, description: "" }));
                            }}
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Type" icon={Bug} required error={errors.type}>
                            <AnimatedDropdown
                                options={allTypes.map(t => ({ label: t, value: t }))}
                                value={editData.type || ""}
                                onChange={v => {
                                    setEditData((d: any) => ({ ...d, type: v as any }));
                                    setErrors(p => ({ ...p, type: "" }));
                                }}
                                placeholder="Select Type"
                                error={!!errors.type}
                                triggerClassName="h-11 bg-muted/20 border-border/60 rounded-xl"
                            />
                        </FormField>
                        <FormField label="Priority" icon={AlertCircle} required error={errors.priority}>
                            <AnimatedDropdown
                                options={allPriorities.map(p => ({ label: p, value: p }))}
                                value={editData.priority || ""}
                                onChange={v => {
                                    setEditData((d: any) => ({ ...d, priority: v as any }));
                                    setErrors(p => ({ ...p, priority: "" }));
                                }}
                                placeholder="Select Priority"
                                error={!!errors.priority}
                                triggerClassName="h-11 bg-muted/20 border-border/60 rounded-xl"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Start Date" icon={Calendar} error={errors.startDate}>
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
                                triggerClassName="h-11 bg-muted/20 border-border/60 rounded-xl"
                            />
                        </FormField>
                        <FormField label="Due Date" icon={Calendar} error={errors.endDate}>
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
                                placeholder={(!editData.startDate && !editData.assignees?.some((a: any) => typeof a === 'object' && a.joinDate)) ? "Pick Start Date first" : "Select due date"}
                                showIcon={false}
                                triggerClassName="h-11 bg-muted/20 border-border/60 rounded-xl"
                            />
                        </FormField>
                    </div>

                    <div className="space-y-4">
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
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background">
                <Button
                    onClick={onSave}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
                >
                    <Check className="w-4.5 h-4.5" />
                    {isEditing ? "Update Ticket" : "Rise Ticket"}
                </Button>
            </div>
            <Dialog open={reasonPopupOpen} onOpenChange={setReasonPopupOpen}>
                <DialogContent className="max-w-md rounded-[24px] z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-primary" />
                            Extension Reason
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <p className="text-sm text-muted-foreground font-medium">
                            You are extending the due date. Please provide a brief reason for tracking.
                        </p>
                        <textarea
                            className="premium-input min-h-[100px] p-4 text-sm resize-none rounded-xl"
                            placeholder="Why is it being extended?"
                            autoFocus
                            value={editData.extendReason || ""}
                            onChange={e => setEditData((d: any) => ({ ...d, extendReason: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="rounded-xl font-bold" onClick={() => {
                            setReasonPopupOpen(false);
                            setPendingEndDate(null);
                        }}>Cancel</Button>
                        <Button
                            className="rounded-xl bg-primary text-white font-black px-6"
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
