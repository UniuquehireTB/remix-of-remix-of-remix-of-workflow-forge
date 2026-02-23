import { teamMembers, getTeamMember } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Check, Users } from "lucide-react";

interface AssigneeSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function AssigneeSelector({ selected, onChange }: AssigneeSelectorProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {teamMembers.map(m => {
        const active = selected.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200",
              active
                ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
              active ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {m.initials}
            </div>
            {m.name}
            {active && <Check className="w-3 h-3 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

interface AssigneeBadgesProps {
  ids: string[];
  max?: number;
}

export function AssigneeBadges({ ids, max = 3 }: AssigneeBadgesProps) {
  const shown = ids.slice(0, max);
  const extra = ids.length - max;

  if (!ids.length) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map(id => {
        const m = getTeamMember(id);
        if (!m) return null;
        return (
          <div
            key={id}
            title={m.name}
            className="w-7 h-7 rounded-lg bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary"
          >
            {m.initials}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-lg bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}
