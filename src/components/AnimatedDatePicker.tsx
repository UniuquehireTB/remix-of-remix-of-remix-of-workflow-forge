import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay, isToday } from "date-fns";

interface AnimatedDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function AnimatedDatePicker({ value, onChange, placeholder = "Pick a date", error, className }: AnimatedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const selectDay = (d: Date) => {
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 border-2 rounded-xl bg-background px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          error ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : "border-input",
          open && "ring-2 ring-primary/20 border-primary"
        )}
      >
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <span className={cn(!selected && "text-muted-foreground/50")}>
          {selected ? format(selected, "MMM dd, yyyy") : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 bg-popover border border-border rounded-xl shadow-xl p-3 w-[280px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <motion.span
                key={format(currentMonth, "MMM yyyy")}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-bold"
              >
                {format(currentMonth, "MMMM yyyy")}
              </motion.span>
              <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day, i) => {
                const sel = selected && isSameDay(day, selected);
                const today = isToday(day);
                return (
                  <motion.button
                    key={day.toISOString()}
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01, duration: 0.1 }}
                    onClick={() => selectDay(day)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-primary/10",
                      sel && "bg-primary text-primary-foreground hover:bg-primary/90",
                      today && !sel && "bg-accent text-accent-foreground font-bold",
                      !sel && !today && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </motion.button>
                );
              })}
            </div>

            {/* Today button */}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => { selectDay(new Date()); setCurrentMonth(new Date()); }}
                className="w-full text-xs font-semibold text-primary hover:text-primary/80 py-1 transition-colors"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
