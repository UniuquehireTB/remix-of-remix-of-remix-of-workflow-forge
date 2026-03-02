import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormFieldProps {
  label: ReactNode;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}

export function FormField({ label, icon: Icon, error, required, children, className, labelClassName }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className={cn("text-[12px] font-bold text-[#6B778C] flex items-center gap-1.5", labelClassName)}>
        {Icon && <Icon className="w-3.5 h-3.5 text-inherit opacity-70" />}
        {label}
        {required && <span className="text-[#DE350B] ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[12px] text-[#DE350B] font-medium pt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5 fill-[#DE350B] text-white" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
