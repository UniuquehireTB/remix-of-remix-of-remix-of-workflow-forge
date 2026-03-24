import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";

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
  disabled?: boolean;
  triggerClassName?: string;
}

export function AnimatedDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  error,
  size = "md",
  disabled,
  triggerClassName,
}: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover.Root open={open && !disabled} onOpenChange={setOpen}>
      <div className={cn("w-full transition-opacity", className, disabled && "opacity-50 pointer-events-none")}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between gap-2 border rounded-[3px] bg-white text-[14px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF] cursor-pointer",
              size === "sm" ? "px-3 h-[34px] text-[12px]" : "px-3 h-[40px]",
              error ? "!border-[#DE350B] focus:ring-[#DE350B]/10" : "border-[#A5ADBA] hover:bg-[#F4F5F7]",
              open && "ring-2 ring-[#4C9AFF]/20 border-[#4C9AFF] bg-white hover:bg-white",
              triggerClassName
            )}
          >
            <span className={cn("flex-1 text-left min-w-0 truncate text-[#172B4D] font-medium", !selected && "text-[#6B778C]/70")}>
              {selected ? (
                <span className="flex items-center gap-2 truncate">
                  {selected.icon && <span className="shrink-0">{selected.icon}</span>}
                  <span className="truncate">{selected.label}</span>
                </span>
              ) : (
                <span className="opacity-60">{placeholder}</span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[#44546F] transition-transform duration-200 shrink-0",
                open && "rotate-180",
                size === "sm" && "w-3.5 h-3.5"
              )}
            />
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content 
          sideOffset={5} 
          align="start" 
          className="z-[10005]"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="bg-white border border-[#DFE1E6] rounded-[3px] shadow-lg overflow-hidden"
              >
                <div className="max-h-[220px] overflow-y-auto py-1 scrollbar-hide">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-[14px] font-medium transition-colors hover:bg-[#F4F5F7] cursor-pointer text-left",
                        value === opt.value ? "bg-[#DEEBFF] text-[#0052CC]" : "text-[#172B4D]"
                      )}
                    >
                      {opt.icon && <span className="shrink-0 scale-90">{opt.icon}</span>}
                      <span className="flex-1 truncate">{opt.label}</span>
                      {value === opt.value && (
                        <span className="ml-auto text-[10px] font-bold text-[#0052CC]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface FilterDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  triggerClassName?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  allLabel = "All",
  triggerClassName,
}: FilterDropdownProps) {
  return (
    <AnimatedDropdown
      size="sm"
      options={[
        { label: allLabel, value: "All" },
        ...options.map((o) => ({ label: o, value: o })),
      ]}
      value={value}
      onChange={onChange}
      className="min-w-[130px]"
      triggerClassName={triggerClassName}
    />
  );
}
