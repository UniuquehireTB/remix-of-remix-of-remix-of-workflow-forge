import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Bell, User, Moon, Sun, LogOut, FolderKanban, Bug, FileText, Table2, Search, X, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Projects", url: "/", icon: FolderKanban },
  { title: "Tickets", url: "/tickets", icon: Bug },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Sheets", url: "/sheets", icon: Table2 },
];

const notifications = [
  { id: 1, title: "Ticket TK-1042 moved to Review", desc: "Sarah Chen moved the ticket", time: "2 min ago", unread: true },
  { id: 2, title: "Sprint 14 started", desc: "Alex Kumar created a new sprint", time: "15 min ago", unread: true },
  { id: 3, title: "New comment on TK-1040", desc: "Mike Johnson: 'The WebSocket implementation needs...'", time: "32 min ago", unread: true },
  { id: 4, title: "Project 'Mobile App v2' updated", desc: "Lisa Wang updated project settings", time: "1h ago", unread: false },
  { id: 5, title: "Bug BG-892 marked as Critical", desc: "Priority escalated by James Park", time: "2h ago", unread: false },
];

export function HeaderNav() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Close drawers on route change
  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-extrabold text-lg tracking-tight">TrackFlow</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.url === "/"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                    activeClassName="!text-primary !bg-primary/8 shadow-sm"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              <button
                onClick={() => { setProfileOpen(true); setNotifOpen(false); }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all duration-200"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {navItems.map(item => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all whitespace-nowrap"
                activeClassName="!text-primary !bg-primary/8"
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {(notifOpen || profileOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={() => { setNotifOpen(false); setProfileOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-md h-screen bg-card border-l border-border shadow-xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Notifications</h2>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                    n.unread ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", n.unread ? "bg-primary" : "bg-transparent")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", n.unread && "font-semibold")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Drawer */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-sm h-screen bg-card border-l border-border shadow-xl"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Profile</h2>
              <button onClick={() => setProfileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-10 h-10" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">John Doe</h3>
                  <p className="text-sm text-muted-foreground">john.doe@company.com</p>
                  <p className="text-xs text-muted-foreground mt-1">Product Manager</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Theme Toggle */}
              <div className="space-y-3">
                <label className="premium-label">Appearance</label>
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                  <button
                    onClick={() => { if (darkMode) toggleDark(); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                      !darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => { if (!darkMode) toggleDark(); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                      darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Logout */}
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
