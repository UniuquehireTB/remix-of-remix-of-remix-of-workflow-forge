import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Bell, User, Moon, Sun, LogOut, FolderKanban, Bug, FileText, X, Rocket, UserPlus, Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { useToast } from "@/hooks/use-toast";
import { authService, notificationService } from "@/services/authService";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { title: "Projects", url: "/", icon: FolderKanban },
  { title: "Tickets", url: "/tickets", icon: Bug },
  { title: "Notes", url: "/notes", icon: FileText },
];

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: string;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

const roles = ["Architect", "Manager", "Technical Analyst", "Senior Developer", "Developer"];

export function HeaderNav() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupRole, setSignupRole] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const currentUser = authService.getCurrentUser();

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationRoute = (type: string): string | null => {
    const t = type?.toLowerCase();
    if (t?.includes('project')) return '/';
    if (t?.includes('ticket')) return '/tickets';
    if (t?.includes('note')) return '/notes';
    return null;
  };

  const handleNotificationClick = async (n: NotificationData) => {
    // Mark as read if unread
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    // Navigate based on type
    const route = getNotificationRoute(n.type);
    if (route) {
      setNotifOpen(false);
      navigate(route);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!signupName.trim()) errs.name = "Name is required";
    if (!signupEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) errs.email = "Enter a valid email";
    if (!signupPassword.trim()) errs.password = "Password is required";
    else if (signupPassword.length < 6) errs.password = "Min 6 characters";
    if (!signupConfirm.trim()) errs.confirm = "Confirm password";
    else if (signupPassword !== signupConfirm) errs.confirm = "Passwords do not match";
    if (!signupRole) errs.role = "Select a role";
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(errs).join(" • "), variant: "destructive" });
      return;
    }
    setSignupLoading(true);
    try {
      await authService.register({
        username: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole
      });

      setSignupLoading(false);
      setSignupOpen(false);
      setSignupName(""); setSignupEmail(""); setSignupPassword(""); setSignupConfirm(""); setSignupRole("");
      toast({ title: "🎉 User Created", description: "New user account has been created." });
    } catch (error: any) {
      setSignupLoading(false);
      toast({
        title: "❌ Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    authService.logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
    toast({ title: "👋 Signed Out", description: "You have been successfully logged out." });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-extrabold text-lg tracking-tight">TrackFlow</span>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <NavLink key={item.url} to={item.url} end={item.url === "/"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                    activeClassName="!text-primary !bg-primary/8 shadow-sm">
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in">{unreadCount}</span>
                )}
              </button>
              <button onClick={() => { setProfileOpen(true); setNotifOpen(false); }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all duration-200">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {navItems.map(item => (
              <NavLink key={item.url} to={item.url} end={item.url === "/"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all whitespace-nowrap"
                activeClassName="!text-primary !bg-primary/8">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-md h-screen bg-card border-l border-border shadow-xl flex flex-col">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold">Notifications</h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                  {unreadCount > 0 && (
                    <>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary hover:underline">Mark all as read</button>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <Bell className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="text-sm font-bold">No notifications yet</p>
                  <p className="text-xs">We'll notify you when something happens</p>
                </div>
              ) : notifications.map((n, i) => {
                const route = getNotificationRoute(n.type);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative group",
                      !n.isRead ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0 transition-colors", !n.isRead ? "bg-primary" : "bg-transparent")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-xs font-black uppercase tracking-widest", !n.isRead ? "text-primary" : "text-muted-foreground")}>{n.type}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-medium">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                        <p className={cn("text-sm mt-1 leading-tight", !n.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{n.message}</p>

                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Drawer */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-sm h-screen bg-card border-l border-border shadow-xl">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Profile</h2>
              <button onClick={() => setProfileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-10 h-10" /></div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{currentUser?.username || "User Account"}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser?.email || "No email provided"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentUser?.role || "Team Member"}</p>
                </div>
              </div>
              <div className="h-px bg-border" />

              {/* Add User button — Architect only */}
              {currentUser?.role === 'Architect' && (
                <button onClick={() => {
                  setProfileOpen(false);
                  setSignupOpen(true);
                  setSignupErrors({});
                }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                  <UserPlus className="w-4 h-4" /> Add User
                </button>
              )}

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground/80">Appearance</label>
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                  <button onClick={() => { if (darkMode) toggleDark(); }}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all", !darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button onClick={() => { if (!darkMode) toggleDark(); }}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all", darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                </div>
              </div>
              <div className="h-px bg-border" />
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-2 p-0 flex flex-col max-h-[90vh] [&>button:last-child]:top-7 [&>button:last-child]:right-6">
          <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
            <div className="flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold capitalize leading-none mb-1.5">Create User Account</DialogTitle>
                <p className="text-[13px] text-muted-foreground font-medium">Add a new member to your workspace</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSignup} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 capitalize">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={signupName} onChange={e => { setSignupName(e.target.value); setSignupErrors(p => ({ ...p, name: "" })); }}
                      placeholder="Enter full name"
                      className={cn("premium-input !pl-12", signupErrors.name && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 capitalize">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={signupEmail} onChange={e => { setSignupEmail(e.target.value); setSignupErrors(p => ({ ...p, email: "" })); }}
                      placeholder="user@company.com"
                      className={cn("premium-input !pl-12", signupErrors.email && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80 capitalize flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" />Assign Role</label>
                <AnimatedDropdown
                  options={roles.map(r => ({ label: r, value: r }))}
                  value={signupRole}
                  onChange={v => { setSignupRole(v); setSignupErrors(p => ({ ...p, role: "" })); }}
                  placeholder="Select a professional role"
                  error={!!signupErrors.role}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 capitalize">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={showPass ? "text" : "password"} value={signupPassword} onChange={e => { setSignupPassword(e.target.value); setSignupErrors(p => ({ ...p, password: "" })); }}
                      placeholder="Min 6 characters"
                      className={cn("premium-input !pl-12 pr-10", signupErrors.password && "!border-destructive focus:ring-destructive/20")} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 capitalize">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type={showConf ? "text" : "password"} value={signupConfirm} onChange={e => { setSignupConfirm(e.target.value); setSignupErrors(p => ({ ...p, confirm: "" })); }}
                      placeholder="Re-enter password"
                      className={cn("premium-input !pl-12 pr-10", signupErrors.confirm && "!border-destructive focus:ring-destructive/20")} />
                    <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end shrink-0">
              <button type="submit" disabled={signupLoading}
                className="w-full sm:w-auto px-8 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
                {signupLoading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Create User Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
