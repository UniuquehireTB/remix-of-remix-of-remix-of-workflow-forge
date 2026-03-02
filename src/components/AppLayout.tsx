import { ReactNode } from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  hideNav?: boolean;
  hideLinks?: boolean;
}

export function AppLayout({ children, title, subtitle, hideNav = false, hideLinks = false, centerContent = false }: AppLayoutProps & { centerContent?: boolean }) {
  return (
    <div className="h-screen flex flex-col w-full bg-background selection:bg-primary/10 overflow-hidden">
      {!hideNav && <HeaderNav hideLinks={hideLinks} />}
      <main className={cn(
        "flex-1 flex flex-col min-h-0",
        !centerContent && "pt-[104px] md:pt-14",
        centerContent && "items-center justify-center p-0"
      )}>
        {children}
      </main>
    </div>
  );
}