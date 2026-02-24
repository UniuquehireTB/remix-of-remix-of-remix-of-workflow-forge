import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface AnimatedDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  size?: "sm" | "md";
}

export function AnimatedDropdown({ options, value, onChange, placeholder = "Select...", className, error, size = "md" }: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-2 border-2 rounded-xl bg-background text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          size === "sm" ? "px-3 py-2 text-xs" : "px-3.5 py-2.5",
          error ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : "border-input",
          open && "ring-2 ring-primary/20 border-primary"
        )}
      >
        <span className={cn(!selected && "text-muted-foreground/50")}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground", size === "sm" && "w-3.5 h-3.5")} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-[200px] overflow-y-auto py-1">
              {options.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-primary/5",
                    value === opt.value && "bg-primary/10 text-primary"
                  )}
                >
                  {opt.icon}
                  {opt.label}
                  {value === opt.value && <span className="ml-auto text-[10px]">✓</span>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Filter dropdown variant - compact
interface FilterDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}

export function FilterDropdown({ options, value, onChange, allLabel = "All" }: FilterDropdownProps) {
  return (
    <AnimatedDropdown
      size="sm"
      options={[
        { label: allLabel, value: "All" },
        ...options.map(o => ({ label: o, value: o }))
      ]}
      value={value}
      onChange={onChange}
      className="min-w-[130px]"
    />
  );
}
