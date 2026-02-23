import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
      <span>Showing {start}-{end} of {totalItems}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
          <Button key={p} variant={p === page ? "secondary" : "ghost"} size="icon" className="h-7 w-7 text-xs" onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize = 8) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return { totalPages, pageSize, totalItems: items.length };
}
