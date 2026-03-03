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
    isCreator?: boolean;
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
    isSaving = false,
    isCreator = true
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
                        label={<div className="flex justify-between items-center w-full"><span>Project name</span><div className="flex items-center gap-1.5"><span className={cn("text-[11px] font-bold", (editData.name?.length || 0) > 70 ? "text-[#DE350B]" : "text-[#6B778C]")}>{editData.name?.length || 0}/80</span><span className="text-[#DE350B] font-bold text-[14px] leading-none select-none">*</span></div></div>}
                        error={errors.name} labelClassName="text-[#44546F] font-bold text-[13px] w-full"
                    >
                        <input
                            className={cn(
                                "premium-input h-[40px] border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D]",
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

                    <FormField label="Client name" required error={errors.client} labelClassName="text-[#44546F] font-bold text-[13px]">
                        <input
                            className={cn(
                                "premium-input h-[40px] border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D]",
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
                        label={<div className="flex justify-between items-center w-full"><span>Description</span><div className="flex items-center gap-1.5"><span className={cn("text-[11px] font-bold", (editData.description?.length || 0) > 450 ? "text-[#DE350B]" : "text-[#6B778C]")}>{editData.description?.length || 0}/500</span><span className="text-[#DE350B] font-bold text-[14px] leading-none select-none">*</span></div></div>}
                        error={errors.description} labelClassName="text-[#44546F] font-bold text-[13px] w-full"
                    >
                        <textarea
                            className={cn(
                                "premium-input min-h-[160px] resize-none border-[#A5ADBA] hover:bg-[#F4F5F7] focus:border-[#4C9AFF] transition-all text-[#172B4D] leading-relaxed p-4",
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
                        {isCreator ? (
                            <>
                                {isEditing && (
                                    <div className="flex items-start gap-2.5 p-3 rounded-[3px] bg-[#DEEBFF] border border-[#B3D4FF]">
                                        <div className="w-4 h-4 mt-0.5 shrink-0 text-[#0052CC]">
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                        </div>
                                        <p className="text-[12px] text-[#0052CC] font-medium leading-relaxed">
                                            <span className="font-bold">Adding new members?</span> They will receive an invitation. They must <span className="font-bold">Accept</span> it before joining the project.
                                        </p>
                                    </div>
                                )}
                                <MemberSelector
                                    label={isEditing ? "Invite members" : "Team members"}
                                    variant="projects"
                                    showSelf={true}
                                    showTeam={false}
                                    selected={editData.members || []}
                                    onChange={members => setEditData((d: any) => ({ ...d, members }))}
                                    error={errors.members}
                                    required
                                    labelClassName="text-[#44546F] font-bold text-[13px]"
                                />
                            </>
                        ) : (
                            <div className="flex items-start gap-2.5 p-3 rounded-[3px] bg-[#FFFAE6] border border-[#FFC400]/40">
                                <div className="w-4 h-4 mt-0.5 shrink-0 text-[#FF991F]">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </div>
                                <p className="text-[12px] text-[#974F0C] font-medium leading-relaxed">
                                    <span className="font-bold">Only the project creator</span> can add or remove members.
                                </p>
                            </div>
                        )}
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
                    className="h-10 px-8 rounded-[3px] bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold shadow-none transition-all flex items-center justify-center min-w-[140px]"
                >
                    {isEditing ? "Save changes" : "Create project"}
                </Button>
            </div>
        </motion.div>
    );
}
