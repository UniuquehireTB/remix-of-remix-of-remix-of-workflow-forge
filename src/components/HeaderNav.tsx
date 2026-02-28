import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Bell, User, Moon, Sun, LogOut, FolderKanban, Bug, FileText, X, Rocket, UserPlus, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Pencil, ChevronLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { useToast } from "@/hooks/use-toast";
import { authService, notificationService } from "@/services/authService";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
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

export function HeaderNav({ hideLinks = false }: { hideLinks?: boolean }) {
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

  // Members list state (Architect only)
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberView, setMemberView] = useState<'profile' | 'members' | 'detail' | 'edit'>('profile');
  const [editMember, setEditMember] = useState({ username: '', email: '', role: '' });
  const [editMemberErrors, setEditMemberErrors] = useState<Record<string, string>>({});
  const [editMemberLoading, setEditMemberLoading] = useState(false);

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

  const fetchMembers = async () => {
    if (currentUser?.role !== 'Architect') return;
    setMembersLoading(true);
    try {
      const data = await authService.getAllUsers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setMembersLoading(false);
    }
  };

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
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (profileOpen && currentUser?.role === 'Architect') {
      fetchMembers();
      setMemberView('profile');
      setSelectedMember(null);
    }
  }, [profileOpen]);

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
    if (t?.includes('project')) return '/projects';
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
      const url = n.targetId ? `${route}?ticketId=${n.targetId}` : route;
      navigate(url);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate in order — stop at first error
    if (!signupName.trim()) {
      setSignupErrors({ name: "Name is required" });
      toast({ title: "⚠️ Validation Error", description: "Full name is required.", variant: "destructive" });
      return;
    }
    if (!signupEmail.trim()) {
      setSignupErrors({ email: "Email is required" });
      toast({ title: "⚠️ Validation Error", description: "Email address is required.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setSignupErrors({ email: "Enter a valid email" });
      toast({ title: "⚠️ Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!signupRole) {
      setSignupErrors({ role: "Select a role" });
      toast({ title: "⚠️ Validation Error", description: "Please assign a role.", variant: "destructive" });
      return;
    }
    if (!signupPassword.trim()) {
      setSignupErrors({ password: "Password is required" });
      toast({ title: "⚠️ Validation Error", description: "Password is required.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      setSignupErrors({ password: "Min 6 characters" });
      toast({ title: "⚠️ Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (!signupConfirm.trim()) {
      setSignupErrors({ confirm: "Please confirm your password" });
      toast({ title: "⚠️ Validation Error", description: "Please confirm your password.", variant: "destructive" });
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupErrors({ confirm: "Passwords do not match" });
      toast({ title: "⚠️ Validation Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setSignupErrors({});
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
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already exists") && msg.includes("email")) {
        setSignupErrors({ email: "This email is already registered" });
        toast({
          title: "⚠️ Duplicate Email",
          description: "An account with this email already exists. Please use a different email.",
          variant: "destructive"
        });
      } else if (msg.includes("username") || msg.includes("already taken")) {
        setSignupErrors({ name: "This username is already taken" });
        toast({
          title: "⚠️ Duplicate Username",
          description: "This username is already in use. Please choose a different name.",
          variant: "destructive"
        });
      } else if (msg.includes("already exists")) {
        setSignupErrors({ email: "This email is already registered" });
        toast({
          title: "⚠️ Duplicate Email",
          description: "An account with this email already exists. Please use a different email.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Registration Failed",
          description: error.message || "An error occurred during registration.",
          variant: "destructive"
        });
      }
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
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-extrabold text-lg tracking-tight">TrackFlow</span>
              </div>
              {!hideLinks && (
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map(item => (
                    <NavLink key={item.url} to={item.url} end={item.url === "/"}
                      className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-primary transition-all duration-300 group"
                      activeClassName="!text-primary">
                      <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span className="relative z-10">{item.title}</span>
                      {location.pathname.startsWith(item.url) && (
                        <motion.div
                          layoutId="navItemActive"
                          className="absolute inset-0 bg-primary/5 border border-primary/10 rounded-lg shadow-[0_2px_10px_-4px_rgba(var(--primary),0.1)]"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hideLinks && (
                <button onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in">{unreadCount}</span>
                  )}
                </button>
              )}
              <button onClick={() => { setProfileOpen(true); setNotifOpen(false); }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-all duration-200">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
          {!hideLinks && (
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
          )}
        </div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {(notifOpen || profileOpen) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-[110] w-full max-w-md h-screen bg-card border-l border-border shadow-xl flex flex-col">
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
            className="fixed top-0 right-0 z-[110] w-full max-w-sm h-screen bg-card border-l border-border shadow-xl flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {memberView !== 'profile' && (
                  <button
                    onClick={() => {
                      if (memberView === 'edit') setMemberView('detail');
                      else if (memberView === 'detail') setMemberView('members');
                      else setMemberView('profile');
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors mr-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-base font-bold">
                  {memberView === 'profile' ? 'Profile'
                    : memberView === 'members' ? 'All Members'
                      : memberView === 'detail' ? 'Member Details'
                        : 'Edit Member'}
                </h2>
              </div>
              <button onClick={() => setProfileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">

              {/* ── PROFILE VIEW ── */}
              {memberView === 'profile' && (
                <div className="p-6 space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-8 h-8" /></div>
                    <div className="text-center">
                      <h3 className="font-bold text-base">{currentUser?.username || "User Account"}</h3>
                      <p className="text-xs text-muted-foreground">{currentUser?.email || "No email"}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{currentUser?.role || "Member"}</span>
                    </div>
                  </div>
                  <div className="h-px bg-border" />

                  {/* Architect-only actions */}
                  {currentUser?.role === 'Architect' && (
                    <div className="space-y-2">
                      <button onClick={() => { setProfileOpen(false); setSignupOpen(true); setSignupErrors({}); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                        <UserPlus className="w-4 h-4" /> Add User
                      </button>
                      <button
                        onClick={() => {
                          setMemberView('members');
                          if (members.length === 0) fetchMembers();
                        }}
                        className="w-full flex items-center gap-2 py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 text-foreground font-semibold text-sm transition-all">
                        <Users className="w-4 h-4 text-muted-foreground" /> All Members
                        {members.length > 0 && <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{members.length}</span>}
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-border" />
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground tracking-wider">Appearance</label>
                    <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                      <button onClick={() => { if (darkMode) toggleDark(); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all", !darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                        <Sun className="w-4 h-4" /> Light
                      </button>
                      <button onClick={() => { if (!darkMode) toggleDark(); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all", darkMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                        <Moon className="w-4 h-4" /> Dark
                      </button>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}

              {/* ── MEMBERS LIST VIEW ── */}
              {memberView === 'members' && (
                <div className="p-4">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                      <Users className="w-10 h-10 mb-2 text-muted-foreground" />
                      <p className="text-sm font-semibold">No members found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m, i) => (
                        <motion.button
                          key={m.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => { setSelectedMember(m); setMemberView('detail'); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/20 transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 text-sm font-bold">
                            {m.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{m.username}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize shrink-0">{m.role}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── DETAIL VIEW ── */}
              {memberView === 'detail' && selectedMember && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-5">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                      {selectedMember.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{selectedMember.username}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                      <span className="inline-block mt-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{selectedMember.role}</span>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div><p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Username</p><p className="text-sm font-semibold">{selectedMember.username}</p></div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div><p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Email</p><p className="text-sm font-semibold">{selectedMember.email}</p></div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div><p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Role</p><p className="text-sm font-semibold capitalize">{selectedMember.role}</p></div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditMember({ username: selectedMember.username, email: selectedMember.email, role: selectedMember.role }); setEditMemberErrors({}); setMemberView('edit'); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                    <Pencil className="w-4 h-4" /> Edit Member
                  </button>
                </motion.div>
              )}

              {/* ── EDIT VIEW ── */}
              {memberView === 'edit' && selectedMember && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Username <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={editMember.username} onChange={e => { setEditMember(p => ({ ...p, username: e.target.value })); setEditMemberErrors(p => ({ ...p, username: '' })); }}
                        placeholder="Enter username" className={cn("premium-input !pl-12", editMemberErrors.username && "!border-destructive")} />
                    </div>
                    {editMemberErrors.username && <p className="text-[11px] text-destructive font-semibold">{editMemberErrors.username}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Email <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={editMember.email} onChange={e => { setEditMember(p => ({ ...p, email: e.target.value })); setEditMemberErrors(p => ({ ...p, email: '' })); }}
                        placeholder="user@company.com" className={cn("premium-input !pl-12", editMemberErrors.email && "!border-destructive")} />
                    </div>
                    {editMemberErrors.email && <p className="text-[11px] text-destructive font-semibold">{editMemberErrors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" />Role <span className="text-destructive">*</span></label>
                    <AnimatedDropdown options={roles.map(r => ({ label: r, value: r }))} value={editMember.role}
                      onChange={v => { setEditMember(p => ({ ...p, role: v })); setEditMemberErrors(p => ({ ...p, role: '' })); }}
                      placeholder="Select role" error={!!editMemberErrors.role} />
                    {editMemberErrors.role && <p className="text-[11px] text-destructive font-semibold">{editMemberErrors.role}</p>}
                  </div>
                  <button disabled={editMemberLoading}
                    onClick={async () => {
                      if (!editMember.username.trim()) { setEditMemberErrors({ username: 'Username is required' }); toast({ title: '⚠️ Validation', description: 'Username is required.', variant: 'destructive' }); return; }
                      if (!editMember.email.trim()) { setEditMemberErrors({ email: 'Email is required' }); toast({ title: '⚠️ Validation', description: 'Email is required.', variant: 'destructive' }); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editMember.email)) { setEditMemberErrors({ email: 'Enter a valid email' }); toast({ title: '⚠️ Validation', description: 'Please enter a valid email.', variant: 'destructive' }); return; }
                      if (!editMember.role) { setEditMemberErrors({ role: 'Role is required' }); toast({ title: '⚠️ Validation', description: 'Please select a role.', variant: 'destructive' }); return; }
                      setEditMemberErrors({});
                      setEditMemberLoading(true);
                      try {
                        await authService.updateUser(selectedMember.id, editMember);
                        const updated = { ...selectedMember, ...editMember };
                        setSelectedMember(updated);
                        setMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                        toast({ title: '✅ Member Updated', description: `${editMember.username} has been updated.` });
                        setMemberView('detail');
                      } catch (err: any) {
                        const msg = (err.message || '').toLowerCase();
                        if (msg.includes('email')) { setEditMemberErrors({ email: 'Email already in use' }); toast({ title: '⚠️ Duplicate Email', description: 'This email is already registered.', variant: 'destructive' }); }
                        else if (msg.includes('username')) { setEditMemberErrors({ username: 'Username already taken' }); toast({ title: '⚠️ Duplicate Username', description: 'This username is already taken.', variant: 'destructive' }); }
                        else { toast({ title: '❌ Update Failed', description: err.message || 'Could not update member.', variant: 'destructive' }); }
                      } finally { setEditMemberLoading(false); }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
                    {editMemberLoading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Pencil className="w-4 h-4" /> Save Changes</>}
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Overlay */}
      <AnimatePresence>
        {signupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm" onClick={() => setSignupOpen(false)} />
        )}
      </AnimatePresence>

      {/* Signup Drawer */}
      <AnimatePresence>
        {signupOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-[110] w-full max-w-md h-screen bg-card border-l border-border shadow-xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-none mb-0.5">Create User Account</h2>
                  <p className="text-[11px] text-muted-foreground font-medium">Add a new member to your workspace</p>
                </div>
              </div>
              <button onClick={() => setSignupOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto scrollbar-hide">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Full Name <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={signupName} onChange={e => { setSignupName(e.target.value); setSignupErrors(p => ({ ...p, name: "" })); }}
                      placeholder="Enter full name"
                      className={cn("premium-input !pl-12", signupErrors.name && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                  {signupErrors.name && <p className="text-[11px] text-destructive font-semibold">{signupErrors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Email Address <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={signupEmail} onChange={e => { setSignupEmail(e.target.value); setSignupErrors(p => ({ ...p, email: "" })); }}
                      placeholder="user@company.com"
                      className={cn("premium-input !pl-12", signupErrors.email && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                  {signupErrors.email && <p className="text-[11px] text-destructive font-semibold">{signupErrors.email}</p>}
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />Assign Role <span className="text-destructive">*</span>
                  </label>
                  <AnimatedDropdown
                    options={roles.map(r => ({ label: r, value: r }))}
                    value={signupRole}
                    onChange={v => { setSignupRole(v); setSignupErrors(p => ({ ...p, role: "" })); }}
                    placeholder="Select a professional role"
                    error={!!signupErrors.role}
                  />
                  {signupErrors.role && <p className="text-[11px] text-destructive font-semibold">{signupErrors.role}</p>}
                </div>

                {/* Password + Confirm — same row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Password <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPass ? "text" : "password"} value={signupPassword} onChange={e => { setSignupPassword(e.target.value); setSignupErrors(p => ({ ...p, password: "" })); }}
                        placeholder="Min 6 chars"
                        className={cn("premium-input !pl-9 pr-8 text-[13px]", signupErrors.password && "!border-destructive focus:ring-destructive/20")} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {signupErrors.password && <p className="text-[10px] text-destructive font-semibold leading-tight">{signupErrors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Confirm <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showConf ? "text" : "password"} value={signupConfirm} onChange={e => { setSignupConfirm(e.target.value); setSignupErrors(p => ({ ...p, confirm: "" })); }}
                        placeholder="Re-enter"
                        className={cn("premium-input !pl-9 pr-8 text-[13px]", signupErrors.confirm && "!border-destructive focus:ring-destructive/20")} />
                      <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {signupErrors.confirm && <p className="text-[10px] text-destructive font-semibold leading-tight">{signupErrors.confirm}</p>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex shrink-0">
                <button type="submit" disabled={signupLoading}
                  className="w-full px-8 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
                  {signupLoading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Create User Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
