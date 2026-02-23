import { ReactNode, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen transition-all duration-300">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
