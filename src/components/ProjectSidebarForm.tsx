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
    isEditing
}: ProjectSidebarFormProps) {
    if (!open) return null;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[500px] bg-background border-l border-border shadow-2xl z-[60] flex flex-col overflow-hidden"
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
            <div className="flex-1 overflow-y-auto premium-scrollbar p-6 space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <FormField label="Project Name" icon={FolderKanban} required error={errors.name}>
                        <input
                            className={cn("premium-input", errors.name && "!border-destructive focus:ring-destructive/20")}
                            placeholder="Enter project name..."
                            value={editData.name || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, name: e.target.value }));
                                setErrors(p => ({ ...p, name: "" }));
                            }}
                        />
                    </FormField>

                    <FormField label="Client" icon={Building2} required error={errors.client}>
                        <input
                            className={cn("premium-input", errors.client && "!border-destructive focus:ring-destructive/20")}
                            placeholder="Client or company name..."
                            value={editData.client || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, client: e.target.value }));
                                setErrors(p => ({ ...p, client: "" }));
                            }}
                        />
                    </FormField>

                    <FormField label="Description" icon={FileText} required error={errors.description}>
                        <textarea
                            className={cn("premium-input min-h-[120px] resize-none", errors.description && "!border-destructive focus:ring-destructive/20")}
                            placeholder="Brief project description..."
                            rows={4}
                            value={editData.description || ""}
                            onChange={e => {
                                setEditData((d: any) => ({ ...d, description: e.target.value }));
                                setErrors(p => ({ ...p, description: "" }));
                            }}
                        />
                    </FormField>

                    <div className="space-y-4 pt-2">
                        <MemberSelector
                            label="Members"
                            icon={Users}
                            variant="projects"
                            showSelf={false}
                            showTeam={false}
                            selected={editData.members || []}
                            onChange={members => setEditData((d: any) => ({ ...d, members }))}
                            error={errors.members}
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
                    {isEditing ? "Update Project" : "Create Project"}
                </Button>
            </div>
        </motion.div>
    );
}
