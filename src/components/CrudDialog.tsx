import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X } from "lucide-react";

interface CrudDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  children: ReactNode;
  saveLabel?: string;
  size?: "sm" | "md" | "lg";
}

export function CrudDialog({ open, onClose, title, onSave, children, saveLabel = "Save Changes", size = "md" }: CrudDialogProps) {
  const maxW = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg";
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className={`${maxW} max-h-[85vh] overflow-y-auto rounded-2xl border-2 p-0`}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold capitalize">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">{children}</div>
        <DialogFooter className="px-6 pb-6 pt-2 gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-6">
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button onClick={onSave} className="rounded-xl px-6 shadow-lg shadow-primary/25">
            <Check className="w-4 h-4 mr-1.5" />
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export function DeleteDialog({ open, onClose, onConfirm, itemName }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-2 border-destructive/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg capitalize">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            Delete {itemName}?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This action cannot be undone. This will permanently delete this item.</p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} className="rounded-xl shadow-lg shadow-destructive/25">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
