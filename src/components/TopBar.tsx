import { Bell, Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
