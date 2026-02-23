import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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
    <div className={cn("space-y-2", className)}>
      <label className="premium-label">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive font-medium animate-fade-in flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}
