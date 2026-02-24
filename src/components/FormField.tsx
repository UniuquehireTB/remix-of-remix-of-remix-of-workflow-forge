import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormFieldProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, icon: Icon, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5 capitalize">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-destructive/90 font-medium pl-0.5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
