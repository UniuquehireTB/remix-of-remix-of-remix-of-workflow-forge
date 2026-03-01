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
  subtitle?: string;
  icon?: ReactNode;
  onSave: () => void;
  children: ReactNode;
  saveLabel?: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function CrudDialog({ open, onClose, title, subtitle, icon, onSave, children, saveLabel = "Save Changes", size = "md", loading = false }: CrudDialogProps) {
  const maxW = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg";
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className={`${maxW} rounded-[3px] border border-border p-0 flex flex-col max-h-[85vh] shadow-2xl [&>button:last-child]:top-5 [&>button:last-child]:right-5`}>
        <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0 bg-white">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-10 h-10 rounded-[3px] bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] shrink-0 border border-[#B3D4FF]/30">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[20px] font-bold text-[#172B4D] leading-[1.2] mb-1 tracking-tight break-all">{title}</DialogTitle>
              {subtitle && <p className="text-[13px] text-[#6B778C] font-medium leading-[1.4] mt-1 break-all">{subtitle}</p>}
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-6 overflow-y-auto flex-1 bg-white">{children}</div>
        <DialogFooter className="px-6 py-4 border-t border-border/60 gap-3 shrink-0 bg-[#FAFBFC]">
          <Button variant="ghost" onClick={onClose} className="rounded-[3px] px-6 h-9 text-[13px] font-bold text-[#42526E] hover:bg-[#EBECF0]">
            Cancel
          </Button>
          <Button onClick={onSave} loading={loading} className="rounded-[3px] px-6 h-9 text-[13px] font-bold bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-none max-w-[240px]">
            <span className="truncate">{saveLabel}</span>
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
  loading?: boolean;
}

export function DeleteDialog({ open, onClose, onConfirm, itemName, loading = false }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md rounded-[3px] border border-[#FFEBE6] bg-white shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-[#FFEBE6] bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[3px] bg-[#FFEBE6] flex items-center justify-center border border-[#FFBDAD]/30 shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#DE350B]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[18px] font-bold text-[#172B4D] leading-tight break-words">
                Delete this item?
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-6">
          <p className="text-[14px] text-[#42526E] leading-relaxed break-words">
            This action is permanent and cannot be undone. Are you sure you want to delete <span className="font-bold text-[#172B4D] break-all">"{itemName}"</span>?
          </p>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-[#FFEBE6] gap-3 bg-[#FAFBFC]">
          <Button variant="ghost" onClick={onClose} className="rounded-[3px] font-bold text-[#42526E] hover:bg-[#EBECF0] h-9 px-6 text-[13px]">Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading} className="rounded-[3px] bg-[#DE350B] hover:bg-[#BF2600] text-white font-bold h-9 px-6 text-[13px] shadow-none">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
