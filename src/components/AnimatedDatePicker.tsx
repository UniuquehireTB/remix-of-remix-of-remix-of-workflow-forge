import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
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
}

export function AnimatedDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  error,
  className,
}: AnimatedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("day");
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );

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

  const selectDay = (d: Date) => {
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
    <>
      {/* ── Trigger ── */}
      <div className={cn("relative", className)}>
        {/* Main open-calendar button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-2 border-2 rounded-xl bg-background px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            error ? "!border-destructive focus:ring-destructive/20" : "border-input",
            open && "ring-2 ring-primary/20 border-primary",
            selected && "pr-8"   // make room for the clear button
          )}
        >
          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className={cn("truncate", !selected && "text-muted-foreground/50")}>
            {selected ? format(selected, "MMM dd, yyyy") : placeholder}
          </span>
        </button>

        {/* Clear button — only shown when a date is selected */}
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            title="Clear date"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Overlay + Card (inline, inside Dialog DOM tree) ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="dp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: "fixed", inset: 0, zIndex: 9998 }}
              className="bg-black/50 backdrop-blur-sm"
              onClick={close}
            />

            {/* Card */}
            <motion.div
              key="dp-card"
              initial={{ opacity: 0, scale: 0.88, x: "-50%", y: "-48%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.88, x: "-50%", y: "-48%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "fixed", top: "50%", left: "50%", zIndex: 9999 }}
              className="bg-popover border border-border rounded-2xl shadow-2xl p-4 w-[300px]"
              onClick={(e) => e.stopPropagation()}
            >

              {/* ── TOP BAR: title + close ── */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Select Date
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── NAV ROW: prev / month+year / next ── */}
              <div className="flex items-center justify-between mb-3">

                {/* Prev arrow */}
                <button
                  type="button"
                  onClick={() => {
                    if (view === "day") setCurrentMonth(subMonths(currentMonth, 1));
                    if (view === "month") setCurrentMonth((p) => setYear(p, currentYear - 1));
                    if (view === "year") setCurrentMonth((p) => setYear(p, yearBase - 12));
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Month + Year buttons */}
                <div className="flex items-center gap-1">
                  {/* Month label — click → month view */}
                  {view !== "year" && (
                    <button
                      type="button"
                      onClick={() => setView(view === "month" ? "day" : "month")}
                      className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded-lg transition-colors hover:bg-muted",
                        view === "month" && "text-primary"
                      )}
                    >
                      {MONTH_FULL[getMonth(currentMonth)]}
                    </button>
                  )}

                  {/* Year label — click → year view */}
                  <button
                    type="button"
                    onClick={() => setView(view === "year" ? "day" : "year")}
                    className={cn(
                      "text-sm font-bold px-2 py-0.5 rounded-lg transition-colors hover:bg-muted",
                      view === "year" && "text-primary"
                    )}
                  >
                    {view === "year" ? `${yearBase} – ${yearBase + 11}` : currentYear}
                  </button>
                </div>

                {/* Next arrow */}
                <button
                  type="button"
                  onClick={() => {
                    if (view === "day") setCurrentMonth(addMonths(currentMonth, 1));
                    if (view === "month") setCurrentMonth((p) => setYear(p, currentYear + 1));
                    if (view === "year") setCurrentMonth((p) => setYear(p, yearBase + 12));
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ── VIEWS ── */}
              <AnimatePresence mode="wait">

                {/* DAY VIEW */}
                {view === "day" && (
                  <motion.div key="day-view" {...fadeSlide}>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {weekDays.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7">
                      {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`e-${i}`} />
                      ))}
                      {days.map((day, i) => {
                        const sel = selected && isSameDay(day, selected);
                        const todayDate = isToday(day);
                        return (
                          <motion.button
                            key={day.toISOString()}
                            type="button"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.005, duration: 0.11 }}
                            onClick={() => selectDay(day)}
                            className={cn(
                              "w-9 h-9 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-primary/10",
                              sel && "bg-primary text-primary-foreground hover:bg-primary/90",
                              todayDate && !sel && "bg-accent text-accent-foreground font-bold ring-1 ring-primary/30",
                              !sel && !todayDate && "text-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Today shortcut */}
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

                {/* MONTH VIEW */}
                {view === "month" && (
                  <motion.div key="month-view" {...fadeSlide}>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map((m, idx) => {
                        const isCurrentMonth = idx === getMonth(currentMonth);
                        const isSelectedMonth = selected && idx === getMonth(selected) && currentYear === getYear(selected);
                        return (
                          <motion.button
                            key={m}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02, duration: 0.12 }}
                            onClick={() => selectMonth(idx)}
                            className={cn(
                              "py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-primary/10",
                              isSelectedMonth && "bg-primary text-primary-foreground hover:bg-primary/90",
                              isCurrentMonth && !isSelectedMonth && "bg-accent text-accent-foreground ring-1 ring-primary/30",
                              !isSelectedMonth && !isCurrentMonth && "text-foreground"
                            )}
                          >
                            {m}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* YEAR VIEW */}
                {view === "year" && (
                  <motion.div key="year-view" {...fadeSlide}>
                    <div className="grid grid-cols-3 gap-2">
                      {yearRange.map((yr, idx) => {
                        const isCurrentYear = yr === currentYear;
                        const isSelectedYear = selected && yr === getYear(selected);
                        return (
                          <motion.button
                            key={yr}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02, duration: 0.12 }}
                            onClick={() => selectYear(yr)}
                            className={cn(
                              "py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-primary/10",
                              isSelectedYear && "bg-primary text-primary-foreground hover:bg-primary/90",
                              isCurrentYear && !isSelectedYear && "bg-accent text-accent-foreground ring-1 ring-primary/30",
                              !isSelectedYear && !isCurrentYear && "text-foreground"
                            )}
                          >
                            {yr}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
