import React from "react";
import {
    X, Check, FolderKanban, Building2, FileText, Users, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FormField } from "@/components/FormField";
import { MemberSelector } from "@/components/MemberSelector";

interface ProjectSidebarFormProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    onSave: () => void;
    editData: any;
    setEditData: React.Dispatch<React.SetStateAction<any>>;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    isEditing: boolean;
    isSaving?: boolean;
}

export function ProjectSidebarForm({
    open,
    onClose,
    title,
    subtitle,
    onSave,
    editData,
    setEditData,
    errors,
    setErrors,
    isEditing,
    isSaving = false
}: ProjectSidebarFormProps) {
    if (!open) return null;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[550px] bg-white border-l border-border shadow-2xl z-[110] flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-white">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={onClose}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-[18px] font-bold text-[#172B4D]">{title}</h2>
                        {subtitle && <p className="text-[12px] text-[#6B778C] font-bold mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[3px] text-[#42526E]" onClick={onClose}>
                    <X className="w-4.5 h-4.5" />
                </Button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-8 space-y-8 bg-white">
                <div className="max-w-xl mx-auto space-y-8">
                    <FormField
                        label={<div className="flex justify-between w-full"><span>Project name</span><span className={cn("text-[10px]", (editData.name?.length || 0) > 70 ? "text-[#DE350B]" : "text-[#6B778C]")}>{editData.name?.length || 0}/80</span></div>}
                        icon={FolderKanban} required error={errors.name} labelClassName="text-[#6B778C] font-bold text-[11px] w-full"
                    >
                        <input
                            className={cn(
                                "premium-input h-10 border-[#DFE1E6] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D]",
                                errors.name && "!border-[#DE350B] focus:ring-[#DE350B]/10"
                            )}
                            placeholder="e.g. Workflow optimization"
                            maxLength={80}
                            value={editData.name || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, name: e.target.value }));
                                setErrors(p => ({ ...p, name: "" }));
                            }}
                        />
                    </FormField>

                    <FormField label="Client name" icon={Building2} required error={errors.client} labelClassName="text-[#6B778C] font-bold text-[11px]">
                        <input
                            className={cn(
                                "premium-input h-10 border-[#DFE1E6] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D]",
                                errors.client && "!border-[#DE350B] focus:ring-[#DE350B]/10"
                            )}
                            placeholder="e.g. Acme corp"
                            value={editData.client || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, client: e.target.value }));
                                setErrors(p => ({ ...p, client: "" }));
                            }}
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
                            placeholder="Provide a brief overview of the project's goals and scope..."
                            rows={5}
                            maxLength={500}
                            value={editData.description || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, description: e.target.value }));
                                setErrors(p => ({ ...p, description: "" }));
                            }}
                        />
                    </FormField>

                    <div className="space-y-4 pt-4 border-t border-border/40">
                        <MemberSelector
                            label="Team members"
                            icon={Users}
                            variant="projects"
                            showSelf={true}
                            showTeam={false}
                            selected={editData.members || []}
                            onChange={members => setEditData((d: any) => ({ ...d, members }))}
                            error={errors.members}
                            labelClassName="text-[#6B778C] font-bold text-[12px]"
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
                    {isEditing ? "Save changes" : "Create project"}
                </Button>
            </div>
        </motion.div>
    );
}
