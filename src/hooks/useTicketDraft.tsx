import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ticketService, projectService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

interface TicketDraftContextType {
    isOpen: boolean;
    isMinimized: boolean;
    editData: any;
    editingId: number | null;
    errors: Record<string, string>;
    isSaving: boolean;
    projects: any[];
    openCreate: (initialData?: any) => void;
    openEdit: (ticket: any) => void;
    closeForm: () => void;
    setIsMinimized: (minimized: boolean) => void;
    setEditData: React.Dispatch<React.SetStateAction<any>>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleSave: (onSuccess?: () => void) => Promise<void>;
    confirmDiscard: () => void;
    cancelDiscard: () => void;
    showDiscardConfirm: boolean;
    setShowDiscardConfirm: (show: boolean) => void;
    showConflictConfirm: boolean;
    setShowConflictConfirm: (show: boolean) => void;
    refreshTrigger: number;
    setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

const TicketDraftContext = createContext<TicketDraftContextType | undefined>(undefined);

const emptyTicket = () => ({
    title: "", description: "", type: "", priority: "",
    projectId: null, startDate: "", endDate: "", assignees: []
});

export const TicketDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>(emptyTicket());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [showConflictConfirm, setShowConflictConfirm] = useState(false);
    const [pendingCreateData, setPendingCreateData] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { toast } = useToast();

    // Persist draft to localStorage
    useEffect(() => {
        const savedDraft = localStorage.getItem("ticket_draft");
        if (savedDraft) {
            try {
                const { data, id, open, minimized } = JSON.parse(savedDraft);
                setEditData(data);
                setEditingId(id);
                setIsOpen(open);
                setIsMinimized(minimized);
            } catch (e) {
                console.error("Failed to parse saved draft", e);
            }
        }
    }, []);

    useEffect(() => {
        // Only save draft for NEW tickets (not editing existing ones)
        if (isOpen && !editingId) {
            localStorage.setItem("ticket_draft", JSON.stringify({
                data: editData,
                id: editingId,
                open: isOpen,
                minimized: isMinimized
            }));
        } else if (!isOpen) {
            // Only remove if it's not open (or keep the previous draft if editing)
            // Actually, if we close a NEW ticket form, we clear the draft.
            // If we finish editing, we should probably clear any stored draft too? 
            // Better to only clear if we explicitly discard or save.
            if (!isMinimized) {
                localStorage.removeItem("ticket_draft");
            }
        }
    }, [editData, editingId, isOpen, isMinimized]);

    const hasContent = useCallback(() => {
        // Only count as draft if user has actually typed something meaningful
        // or added assignees. projectId/type/priority might be pre-filled defaults.
        return !!(
            editData.title?.trim() ||
            editData.description?.trim() ||
            (editData.assignees && editData.assignees.length > 0) ||
            editData.extendReason?.trim()
        );
    }, [editData]);

    const fetchProjects = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await projectService.getAll({ limit: 100 });
            setProjects(response.data);
        } catch (err) {
            console.error("Failed to load projects for draft", err);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const openCreate = (initialData?: any) => {
        if (hasContent() && !editingId) {
            setPendingCreateData(initialData || {});
            setShowConflictConfirm(true);
            return;
        }
        setEditData({ ...emptyTicket(), ...initialData, extendReason: "" });
        setEditingId(null);
        setErrors({});
        setIsMinimized(false);
        setIsOpen(true);
    };

    const confirmDiscard = () => {
        setEditData({ ...emptyTicket(), extendReason: "" });
        setEditingId(null);
        setErrors({});
        setShowConflictConfirm(false);
        setShowDiscardConfirm(false);
        localStorage.removeItem("ticket_draft");

        if (pendingCreateData) {
            setEditData({ ...emptyTicket(), ...pendingCreateData, extendReason: "" });
            setIsOpen(true);
            setIsMinimized(false);
            setPendingCreateData(null);
        } else {
            setIsOpen(false);
            setIsMinimized(false);
        }
    };

    const cancelDiscard = () => {
        setShowConflictConfirm(false);
        setShowDiscardConfirm(false);
        setPendingCreateData(null);
        // Ensure form is open if we were "keeping editing"
        setIsOpen(true);
        setIsMinimized(false);
    };

    const openEdit = (t: any) => {
        setEditData({
            ...t,
            assignees: t.assignees?.map((a: any) => ({
                id: a.id,
                startDate: a.TicketAssignee?.startDate || "",
                endDate: a.TicketAssignee?.endDate || ""
            })),
            extendReason: ""
        });
        setEditingId(t.id);
        setErrors({});
        setIsMinimized(false);
        setIsOpen(true);
    };

    const closeForm = () => {
        // Only ask for confirmation or minimize for NEW tickets (not editing existing ones)
        if (!editingId && hasContent()) {
            setShowDiscardConfirm(true);
        } else {
            setIsOpen(false);
            setIsMinimized(false);
            setEditingId(null);
            setEditData(emptyTicket());
            setErrors({});
            setShowDiscardConfirm(false);
            localStorage.removeItem("ticket_draft");
        }
    };

    const handleSave = async (onSuccess?: () => void) => {
        const showErr = (field: string, msg: string, toastMsg: string) => {
            setErrors({ [field]: msg });
            toast({ title: "Validation Error", description: toastMsg, variant: "destructive" });
        };

        if (!editData.title?.trim()) return showErr("title", "Summary is required", "Please enter a ticket summary.");

        if (editData.startDate && editData.endDate && new Date(editData.endDate) < new Date(editData.startDate)) {
            return showErr("endDate", "Due date cannot be earlier than start date", "Check your dates.");
        }

        const hasAssigneeWithDate = editData.assignees?.some((a: any) => typeof a === 'object' && (a.startDate || a.endDate));
        if ((editData.startDate || hasAssigneeWithDate) && !editData.endDate) return showErr("endDate", "Due date is required", "Due date is required.");
        if (editData.startDate && editData.endDate && new Date(editData.endDate) < new Date(editData.startDate)) return showErr("endDate", "Invalid dates", "Due date cannot be earlier than start date.");

        setErrors({});
        setIsSaving(true);
        const startTime = Date.now();

        try {
            const payload = {
                title: editData.title,
                description: editData.description,
                type: editData.type,
                priority: editData.priority,
                projectId: editData.projectId,
                startDate: editData.startDate || null,
                endDate: editData.endDate || null,
                assignees: editData.assignees?.map((a: any) => {
                    const id = typeof a === 'object' ? a.id : a;
                    const mStart = (typeof a === 'object' && a.startDate) ? a.startDate : null;
                    return { id, startDate: mStart, endDate: null };
                })
            };

            if (editingId) {
                await ticketService.update(editingId, payload);
                toast({ title: "Ticket Updated", variant: "success" });
            } else {
                await ticketService.create(payload);
                toast({ title: "Ticket Created", variant: "success" });
            }

            setIsOpen(false);
            setIsMinimized(false);
            setEditingId(null);
            setEditData(emptyTicket());
            localStorage.removeItem("ticket_draft");

            // Trigger global refresh for board and detail views
            setRefreshTrigger(prev => prev + 1);

            if (typeof onSuccess === 'function') {
                await onSuccess();
            }
        } catch (err: any) {
            console.error("Save error details:", err);
            const msg = err.response?.data?.message || err.message || "Failed to save ticket";

            if (msg.toLowerCase().includes("assignee")) {
                setErrors({ assignees: msg });
            } else {
                setErrors({ title: msg });
            }

            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            const elapsed = Date.now() - startTime;
            setTimeout(() => setIsSaving(false), Math.max(0, 1000 - elapsed));
        }
    };

    return (
        <TicketDraftContext.Provider value={{
            isOpen, isMinimized, editData, editingId, errors, isSaving, projects,
            openCreate, openEdit, closeForm, setIsMinimized, setEditData, setErrors, handleSave,
            confirmDiscard, cancelDiscard, showDiscardConfirm, setShowDiscardConfirm,
            showConflictConfirm, setShowConflictConfirm, refreshTrigger, setRefreshTrigger
        }}>
            {children}
        </TicketDraftContext.Provider>
    );
};

export const useTicketDraft = () => {
    const context = useContext(TicketDraftContext);
    if (!context) throw new Error("useTicketDraft must be used within a TicketDraftProvider");
    return context;
};
