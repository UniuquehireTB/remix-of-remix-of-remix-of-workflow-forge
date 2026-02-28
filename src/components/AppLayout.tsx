import { ReactNode } from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  hideNav?: boolean;
}

export function AppLayout({ children, title, subtitle, hideNav = false, centerContent = false }: AppLayoutProps & { centerContent?: boolean }) {
  return (
    <div className="h-screen flex flex-col w-full bg-background selection:bg-primary/10 overflow-hidden">
      {!hideNav && <HeaderNav hideLinks={hideNav} />}
      <main className={cn(
        "flex-1 flex flex-col min-h-0",
        !centerContent && "pt-16",
        centerContent && "items-center justify-center p-0"
      )}>
        {children}
      </main>
    </div>
  );
}
