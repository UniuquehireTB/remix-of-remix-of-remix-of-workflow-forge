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
  const [openUpward, setOpenUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  const handleOpen = () => {
    if (disabled) return;

    if (!open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(options.length * 40 + 8, 210);
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < dropdownHeight && rect.top > dropdownHeight);
    }

    setOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    /*
     * position:relative wrapper — the absolute dropdown is positioned
     * relative to this, not to the Dialog or viewport.
     * This avoids both:
     *  1. createPortal (Radix blocks pointer events outside its DOM)
     *  2. position:fixed (breaks when parent has CSS transform, e.g. Radix animations)
     */
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "w-full flex items-center justify-between gap-2 border rounded-[3px] bg-white text-[14px] font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#4C9AFF] focus:border-[#4C9AFF] cursor-pointer",
          size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-3 py-2",
          error ? "!border-[#DE350B] focus:ring-[#DE350B]" : "border-[#DFE1E6]",
          open && "ring-1 ring-[#4C9AFF] border-[#4C9AFF]",
          disabled && "opacity-50 cursor-not-allowed bg-[#F4F5F7]",
          triggerClassName
        )}
      >
        <span className={cn("flex-1 text-left min-w-0 truncate text-[#172B4D]", !selected && "text-[#6B778C]/60")}>
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.icon && <span className="shrink-0 scale-90">{selected.icon}</span>}
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[#6B778C]",
              size === "sm" && "w-3.5 h-3.5"
            )}
          />
        </motion.div>
      </button>

      {/* Dropdown menu — absolute below (or above) the trigger */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cn(
              "absolute left-0 z-[9999] w-full bg-white border border-[#DFE1E6] rounded-[3px] shadow-lg overflow-hidden",
              openUpward ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            <div className="max-h-[220px] overflow-y-auto py-1 scrollbar-hide">
              {options.map((opt, i) => (
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
    </div>
  );
}

// Filter dropdown variant — compact
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
