import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from "date-fns";

type View = "day" | "month" | "year";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface AnimatedDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  triggerClassName?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  showIcon?: boolean;
}

export function AnimatedDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  error,
  className,
  triggerClassName,
  children,
  disabled,
  minDate,
  maxDate,
  showIcon = true,
}: AnimatedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("day");
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );

  // Sync month on open, jumping to valid range if current value is invalid
  useEffect(() => {
    if (open) {
      let d = value ? new Date(value) : new Date();
      if (isNaN(d.getTime())) d = new Date();

      if (minDate && d < new Date(minDate)) d = new Date(minDate);
      if (maxDate && d > new Date(maxDate)) d = new Date(maxDate);

      setCurrentMonth(d);
    }
  }, [open, value, minDate, maxDate]);

  const selected = value ? new Date(value) : null;
  const currentYear = getYear(currentMonth);

  // Year grid: 12 years, 4 per row, centered on currentYear
  const yearBase = Math.floor(currentYear / 12) * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isDateDisabled = (day: Date) => {
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (day < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (day > max) return true;
    }
    return false;
  };

  const selectDay = (d: Date) => {
    if (isDateDisabled(d)) return;
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
    setView("day");
  };

  const selectMonth = (monthIdx: number) => {
    setCurrentMonth((prev) => setMonth(prev, monthIdx));
    setView("day");
  };

  const selectYear = (year: number) => {
    setCurrentMonth((prev) => setYear(prev, year));
    setView("month");
  };

  const close = () => {
    setOpen(false);
    setView("day");
  };

  // Shared animation variants
  const fadeSlide = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.18 },
  };

  return (
    <DialogPrimitive.Root open={open && !disabled} onOpenChange={setOpen}>
      <div className={cn("relative", className, disabled && "opacity-60")}>
        <DialogPrimitive.Trigger asChild disabled={disabled}>
          {children ? (
            <div className={cn(
              "focus:outline-none",
              disabled ? "cursor-not-allowed pointer-events-none" : "cursor-pointer",
              triggerClassName
            )}>
              {children}
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "w-full flex items-center border-2 rounded-xl bg-background px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                (selected || placeholder) && "gap-2",
                error ? "!border-destructive focus:ring-destructive/20" : "border-input",
                open && "ring-2 ring-primary/20 border-primary",
                selected && "pr-8",
                disabled ? "bg-muted/50 cursor-not-allowed border-muted" : "hover:border-primary/30",
                triggerClassName
              )}
            >
              {showIcon && <CalendarIcon className="w-4 h-4 shrink-0" />}
              {(selected || placeholder) && (
                <span className={cn("truncate", !selected && "text-muted-foreground/50")}>
                  {selected ? format(selected, "MMM dd, yyyy") : placeholder}
                </span>
              )}
            </button>
          )}
        </DialogPrimitive.Trigger>

        {!children && selected && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            title="Clear date"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <DialogPrimitive.Portal>
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <DialogPrimitive.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
          </DialogPrimitive.Overlay>

          <DialogPrimitive.Content asChild className="z-[10001] outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative bg-popover border border-border rounded-3xl shadow-2xl p-4 w-[310px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── TOP BAR: title ── */}
              <div className="flex items-center justify-between mb-3 px-1">
                <DialogPrimitive.Title className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Select Date
                </DialogPrimitive.Title>
                <DialogPrimitive.Close className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </DialogPrimitive.Close>
              </div>

              {/* ── NAV ROW ── */}
              <div className="flex items-center justify-between mb-3 bg-muted/20 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (view === "day") setCurrentMonth(subMonths(currentMonth, 1));
                    if (view === "month") setCurrentMonth((p) => setYear(p, currentYear - 1));
                    if (view === "year") setCurrentMonth((p) => setYear(p, yearBase - 12));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background transition-colors shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {view !== "year" && (
                    <button
                      type="button"
                      onClick={() => setView(view === "month" ? "day" : "month")}
                      className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg transition-colors hover:bg-background uppercase tracking-tighter",
                        view === "month" && "text-primary"
                      )}
                    >
                      {MONTH_FULL[getMonth(currentMonth)]}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setView(view === "year" ? "day" : "year")}
                    className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-lg transition-colors hover:bg-background uppercase tracking-tighter",
                      view === "year" && "text-primary"
                    )}
                  >
                    {view === "year" ? `${yearBase}–${yearBase + 11}` : currentYear}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (view === "day") setCurrentMonth(addMonths(currentMonth, 1));
                    if (view === "month") setCurrentMonth((p) => setYear(p, currentYear + 1));
                    if (view === "year") setCurrentMonth((p) => setYear(p, yearBase + 12));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background transition-colors shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ── VIEWS ── */}
              <AnimatePresence mode="wait">
                {view === "day" && (
                  <motion.div key="day-view" {...fadeSlide}>
                    <div className="grid grid-cols-7 mb-1">
                      {weekDays.map((d) => (
                        <div key={d} className="text-center text-[9px] font-black text-muted-foreground/50 py-1 uppercase tracking-tighter">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`e-${i}`} />
                      ))}
                      {days.map((day, i) => {
                        const sel = selected && isSameDay(day, selected);
                        const todayDate = isToday(day);
                        const isDisabled = isDateDisabled(day);
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => selectDay(day)}
                            disabled={isDisabled}
                            className={cn(
                              "w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150",
                              sel && !isDisabled && "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20",
                              sel && isDisabled && "bg-destructive text-white shadow-lg shadow-destructive/20",
                              todayDate && !sel && "bg-primary/10 text-primary font-black ring-1 ring-primary/20",
                              !sel && !todayDate && !isDisabled && "text-foreground/80 hover:bg-primary/10",
                              isDisabled && !sel && "text-muted-foreground/30 cursor-not-allowed"
                            )}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => { selectDay(new Date()); setCurrentMonth(new Date()); }}
                        disabled={isDateDisabled(new Date())}
                        className={cn(
                          "w-full text-[9px] font-black uppercase tracking-[0.2em] text-primary py-2 rounded-xl transition-all",
                          isDateDisabled(new Date()) ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/5"
                        )}
                      >
                        Jump to Today
                      </button>
                    </div>
                  </motion.div>
                )}

                {view === "month" && (
                  <motion.div key="month-view" {...fadeSlide}>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map((m, idx) => {
                        const isCurrentMonth = idx === getMonth(currentMonth);
                        const isSelectedMonth = selected && idx === getMonth(selected) && currentYear === getYear(selected);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => selectMonth(idx)}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                              isSelectedMonth && "bg-primary text-white shadow-lg shadow-primary/20",
                              isCurrentMonth && !isSelectedMonth && "bg-primary/10 text-primary ring-1 ring-primary/20",
                              !isSelectedMonth && !isCurrentMonth && "text-foreground/70 hover:bg-primary/5"
                            )}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {view === "year" && (
                  <motion.div key="year-view" {...fadeSlide}>
                    <div className="grid grid-cols-3 gap-2">
                      {yearRange.map((yr, idx) => {
                        const isCurrentYear = yr === currentYear;
                        const isSelectedYear = selected && yr === getYear(selected);
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => selectYear(yr)}
                            className={cn(
                              "py-3 rounded-xl text-xs font-black transition-all",
                              isSelectedYear && "bg-primary text-white shadow-lg shadow-primary/20",
                              isCurrentYear && !isSelectedYear && "bg-primary/10 text-primary ring-1 ring-primary/20",
                              !isSelectedYear && !isCurrentYear && "text-foreground/70 hover:bg-primary/5"
                            )}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
