import { useState, useRef, useEffect } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { teamMembers, TeamMember } from "@/lib/data";
import { cn } from "@/lib/utils";

interface AssigneeSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function AssigneeSelector({ selected, onChange, className }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectedMembers = teamMembers.filter(m => selected.includes(m.id));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[38px] text-left"
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedMembers.length === 0 && <span className="text-muted-foreground">Select assignees...</span>}
          {selectedMembers.map(m => (
            <span key={m.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md">
              {m.initials}
              <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(m.id); }} />
            </span>
          ))}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {teamMembers.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                {m.initials}
              </div>
              <div className="flex-1">
                <span className="block">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
              {selected.includes(m.id) && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssigneeBadges({ ids, max = 3 }: { ids: string[]; max?: number }) {
  const members = teamMembers.filter(m => ids.includes(m.id));
  const shown = members.slice(0, max);
  const extra = members.length - max;
  return (
    <div className="flex items-center -space-x-1">
      {shown.map(m => (
        <div key={m.id} className="w-6 h-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-semibold text-primary" title={m.name}>
          {m.initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}
