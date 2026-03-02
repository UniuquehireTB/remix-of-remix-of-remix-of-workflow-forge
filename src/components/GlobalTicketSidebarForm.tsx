import React from "react";
import { TicketSidebarForm } from "./TicketSidebarForm";
import { useTicketDraft } from "@/hooks/useTicketDraft";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, X } from "lucide-react";

export function GlobalTicketSidebarForm() {
    const {
        isOpen, isMinimized, editData, editingId, errors, isSaving, projects,
        closeForm, setIsMinimized, setEditData, setErrors, handleSave
    } = useTicketDraft();

    return (
        <>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <TicketSidebarForm
                        key="global-ticket-form"
                        open={isOpen}
                        onClose={closeForm}
                        title={editingId ? "Edit ticket" : "Create ticket"}
                        subtitle={editingId ? "Update ticket details" : "Create a new support or task ticket"}
                        onSave={() => handleSave()}
                        editData={editData}
                        setEditData={setEditData}
                        projects={projects}
                        errors={errors}
                        setErrors={setErrors}
                        isEditing={!!editingId}
                        isSaving={isSaving}
                        isMinimized={isMinimized}
                        onMinimize={setIsMinimized}
                    />
                )}
            </AnimatePresence>

            <ConflictDraftDialog />
            <DiscardConfirmDialog />
        </>
    );
}

function ConflictDraftDialog() {
    const {
        showConflictConfirm, setShowConflictConfirm,
        confirmDiscard, cancelDiscard
    } = useTicketDraft();

    return (
        <Dialog open={showConflictConfirm} onOpenChange={setShowConflictConfirm}>
            <DialogContent className="max-w-[500px] p-0 rounded-[3px] border-none shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="w-6 h-6 text-[#FFAB00]" fill="#FFAB00" fillOpacity={0.1} />
                        <h2 className="text-[20px] font-medium text-[#172B4D] tracking-tight">Draft work item in progress</h2>
                    </div>

                    <p className="text-[14px] leading-relaxed text-[#172B4D] mb-8">
                        It looks like you’re already creating a work item. Creating a new one will discard your draft and any changes you’ve made won’t be saved.
                    </p>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={confirmDiscard}
                            className="text-[14px] font-medium text-[#42526E] hover:bg-transparent hover:text-[#172B4D] px-4"
                        >
                            Discard draft
                        </Button>
                        <Button
                            onClick={cancelDiscard}
                            className="bg-[#FFAB00] hover:bg-[#FF9900] text-[#172B4D] font-medium text-[14px] rounded-[3px] px-6 h-9 shadow-sm"
                        >
                            Keep editing
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DiscardConfirmDialog() {
    const {
        showDiscardConfirm, setShowDiscardConfirm,
        confirmDiscard, cancelDiscard, setIsMinimized
    } = useTicketDraft();

    return (
        <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
            <DialogContent className="max-w-[400px] p-0 rounded-[3px] border-none shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[20px] font-bold text-[#172B4D] tracking-tight">Your changes won’t be saved</h2>
                    </div>

                    <p className="text-[14px] leading-relaxed text-[#42526E] mb-8">
                        We won't be able to save your data if you move away from this page.
                    </p>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={cancelDiscard}
                            className="text-[14px] font-medium text-[#42526E] hover:bg-transparent hover:text-[#172B4D] px-4"
                        >
                            Go back
                        </Button>
                        <Button
                            onClick={() => {
                                confirmDiscard();
                            }}
                            className="bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold text-[14px] rounded-[3px] px-6 h-9 shadow-sm"
                        >
                            Discard
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function GlobalTicketBackdrop() {
    const { isOpen, isMinimized, setIsMinimized, showDiscardConfirm } = useTicketDraft();

    if (!isOpen || isMinimized) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    // Clicking backdrop should minimize automatically as per previous Jira logic
                    // and Jira usually doesn't show discard prompt for backdrop clicks unless explicitly cancelling
                    setIsMinimized(true);
                }}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[50]"
            />
        </AnimatePresence>
    );
}
