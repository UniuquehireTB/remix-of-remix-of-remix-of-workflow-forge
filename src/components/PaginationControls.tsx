import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}

export function PaginationControls({ page, totalPages, onPageChange, totalItems, pageSize }: PaginationControlsProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between mt-6 animate-fade-in">
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
        Showing <span className="text-foreground tracking-normal">
          {start === end ? start : `${start} to ${end}`}
        </span> of <span className="text-foreground tracking-normal">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 w-8 p-0 rounded-lg">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={cn("h-8 w-8 p-0 rounded-lg text-[11px] font-bold", p === page && "shadow-md shadow-primary/20")}
          >
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 w-8 p-0 rounded-lg">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
