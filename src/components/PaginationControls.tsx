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
      <p className="text-xs text-muted-foreground font-medium">
        Showing <span className="text-foreground font-semibold">
          {start === end ? start : `${start} to ${end}`}
        </span> of <span className="text-foreground font-semibold">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-9 w-9 p-0 rounded-xl">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={cn("h-9 w-9 p-0 rounded-xl text-xs font-semibold", p === page && "shadow-lg shadow-primary/25")}
          >
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-9 w-9 p-0 rounded-xl">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
