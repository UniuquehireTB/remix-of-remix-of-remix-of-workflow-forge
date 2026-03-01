import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === 'success' ? CheckCircle2
          : variant === 'destructive' ? AlertCircle
            : variant === 'warning' ? AlertTriangle
              : variant === 'info' ? Info
                : null;

        return (
          <Toast key={id} variant={variant} {...props} className="shadow-2xl">
            <div className="flex items-start gap-4 w-full">
              {Icon && (
                <div className={cn(
                  "mt-0.5 shrink-0 p-2 rounded-full shadow-sm border border-white/20",
                  variant === 'success' ? "bg-[#00875A]/20 text-[#00875A]" :
                    variant === 'destructive' ? "bg-[#DE350B]/20 text-[#DE350B]" :
                      variant === 'warning' ? "bg-[#FFAB00]/20 text-[#825C00]" :
                        variant === 'info' ? "bg-[#0052CC]/20 text-[#0747A6]" : "bg-white/20"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="grid gap-1 flex-1 min-w-0 pr-6 pt-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose className="top-4 right-4 text-inherit" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
