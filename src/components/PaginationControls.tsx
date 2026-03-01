import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
  className?: string;
}

export function PaginationControls({ page, totalPages, onPageChange, totalItems, pageSize, className }: PaginationControlsProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn("flex items-center justify-between mt-6 animate-fade-in", className)}>
      <p className="text-[10px] text-[#6B778C] font-bold">
        Showing <span className="text-[#172B4D] tracking-normal font-extrabold">
          {start === end ? start : `${start} to ${end}`}
        </span> of <span className="text-[#172B4D] tracking-normal font-extrabold">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 w-8 p-0 rounded-[3px]">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={cn("h-8 w-8 p-0 rounded-[3px] text-[11px] font-bold transition-all", p === page ? "bg-[#0052CC] text-white shadow-none" : "text-[#42526E] hover:bg-[#F4F5F7]")}
          >
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 w-8 p-0 rounded-[3px]">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
