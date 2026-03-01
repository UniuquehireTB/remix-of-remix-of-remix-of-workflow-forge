import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Bell, User, Moon, Sun, LogOut, FolderKanban, Bug, FileText, X, Rocket, UserPlus, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Pencil, ChevronLeft, Users, ExternalLink, MoreHorizontal, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnimatedDropdown } from "@/components/AnimatedDropdown";
import { useToast } from "@/hooks/use-toast";
import { authService, notificationService } from "@/services/authService";
import { Button } from "@/components/ui/button";
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
  const [darkMode, setDarkMode] = useState(() => {
    // Read persisted preference on first render
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
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
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'watching'>('direct');
  const [activeIndex, setActiveIndex] = useState(-1);
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

  // Apply dark class on mount from persisted preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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
    if (!notifOpen) {
      setActiveIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const filtered = notifications.filter(n => !showOnlyUnread || !n.isRead);
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleNotificationClick(filtered[activeIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notifOpen, activeIndex, notifications, showOnlyUnread]);

  useEffect(() => {
    if (activeIndex >= 0) {
      const element = document.getElementById(`notif-${activeIndex}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeIndex]);

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
      toast({ title: "Validation Error", description: "Full name is required.", variant: "destructive" });
      return;
    }
    if (!signupEmail.trim()) {
      setSignupErrors({ email: "Email is required" });
      toast({ title: "Validation Error", description: "Email address is required.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setSignupErrors({ email: "Enter a valid email" });
      toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!signupRole) {
      setSignupErrors({ role: "Select a role" });
      toast({ title: "Validation Error", description: "Please assign a role.", variant: "destructive" });
      return;
    }
    if (!signupPassword.trim()) {
      setSignupErrors({ password: "Password is required" });
      toast({ title: "Validation Error", description: "Password is required.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      setSignupErrors({ password: "Min 6 characters" });
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (!signupConfirm.trim()) {
      setSignupErrors({ confirm: "Please confirm your password" });
      toast({ title: "Validation Error", description: "Please confirm your password.", variant: "destructive" });
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupErrors({ confirm: "Passwords do not match" });
      toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setSignupErrors({});
    const startTime = Date.now();
    setSignupLoading(true);
    try {
      await authService.register({
        username: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole
      });

      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        setSignupLoading(false);
        setSignupOpen(false);
        setSignupName(""); setSignupEmail(""); setSignupPassword(""); setSignupConfirm(""); setSignupRole("");
        toast({ title: "User Created", description: "New user account has been created.", variant: "success" });
      }, Math.max(0, 1500 - elapsed));
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
          title: "Duplicate Username",
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
    toast({ title: "Signed Out", description: "You have been successfully logged out.", variant: "success" });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-[var(--jira-border)] h-14" style={{ backgroundColor: 'var(--jira-surface)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                <div className="w-8 h-8 rounded-[3px] bg-[#0052CC] flex items-center justify-center shadow-sm">
                  <div className="w-4 h-4 border-2 border-white rounded-[1px]" />
                </div>
                <span className="font-bold text-lg text-[#172B4D] tracking-tight">Track Flow</span>
              </div>
              {!hideLinks && (
                <nav className="hidden md:flex items-center h-full gap-2">
                  {navItems.map(item => {
                    const isActive = location.pathname.startsWith(item.url);
                    return (
                      <NavLink key={item.url} to={item.url} end={item.url === "/"}
                        className={cn(
                          "relative flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-sm font-medium transition-all duration-200 h-full",
                          isActive ? "text-[#0052CC]" : "text-[#42526E] hover:bg-[#F4F5F7] hover:text-[#172B4D]"
                        )}
                        activeClassName="!text-[#0052CC]">
                        <span className="relative z-10">{item.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId="navItemActive"
                            className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0052CC] rounded-t-[1px]"
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!hideLinks && (
                <button onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] hover:text-[#172B4D] transition-all duration-200">
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[#DE350B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>
                  )}
                </button>
              )}
              <button onClick={() => { setProfileOpen(true); setNotifOpen(false); }}
                className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white hover:bg-[#0747A6] transition-all duration-200 overflow-hidden shadow-sm">
                {currentUser?.username ? (
                  <span className="text-[12px] font-bold">
                    {currentUser.username.substring(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {!hideLinks && (
            <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
              {navItems.map(item => (
                <NavLink key={item.url} to={item.url} end={item.url === "/"}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#42526E] hover:text-[#172B4D] hover:bg-[#F4F5F7] rounded-[3px] transition-all whitespace-nowrap"
                  activeClassName="!text-[#0052CC] !bg-[#0052CC]/10">
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
            className="fixed top-0 right-0 z-[110] w-full max-w-lg h-screen bg-card border-l border-border shadow-2xl flex flex-col">

            {/* Header */}
            <div className="pt-6 px-6 shrink-0">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[20px] font-medium text-[#172B4D]">Notifications</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#42526E]">Only show unread</span>
                    <button
                      onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                      className={cn(
                        "w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0",
                        showOnlyUnread ? "bg-[#0052CC]" : "bg-[#6B778C]/40"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm",
                        showOnlyUnread ? "left-5" : "left-1"
                      )} />
                    </button>
                  </div>
                  <button onClick={() => setNotifOpen(false)} className="text-[#42525E] hover:text-[#172B4D] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-[#DFE1E6]">
                <div className="pb-2 text-[12px] font-bold text-[#0052CC] relative">
                  Direct
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0052CC]" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 premium-scrollbar">
              {notifications.length > 0 && (
                <div className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-4">Today</div>
              )}

              {notifications.filter(n => !showOnlyUnread || !n.isRead).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 21V3H14L14.5 5H20V15H13L12.5 13H7V21H5Z" fill="#FFC400" stroke="#FFC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="15" y="11" width="6" height="6" rx="1" fill="#0052CC" />
                    </svg>
                  </div>
                  <p className="text-[16px] text-[#172B4D] mb-1">That's all your notifications from</p>
                  <p className="text-[16px] text-[#172B4D]">the last 30 days.</p>
                </div>
              ) : notifications.filter(n => !showOnlyUnread || !n.isRead).map((n, i) => (
                <div
                  key={n.id}
                  id={`notif-${i}`}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex items-start gap-4 py-3 cursor-pointer group -mx-6 px-6 transition-colors",
                    activeIndex === i ? "bg-[#F4F5F7] border-l-2 border-[#0052CC] pl-[22px]" : "hover:bg-[#F4F5F7]",
                    !n.isRead && activeIndex !== i ? "bg-[#DEEBFF]/10" : ""
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-[#E54937] shrink-0 flex items-center justify-center text-white font-bold text-[14px]">
                    {n.message.includes('added') ? 'S' : (currentUser?.username?.charAt(0).toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] text-[#172B4D]">
                        <span className="font-bold">n.syedraja</span> {n.message}
                      </span>
                      <span className="text-[13px] text-[#6B778C] shrink-0">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: false })} ago
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <LifeBuoy className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span className="text-[11px] text-[#42526E]">Rivo App</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#0052CC] mt-2.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#DFE1E6] bg-white">
              <div className="flex items-center justify-between p-2 border border-[#DFE1E6] rounded-[3px] bg-white">
                <div className="flex items-center gap-2 text-[12px] text-[#42526E]">
                  <span>Press</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[#F4F5F7] border border-[#DFE1E6] rounded text-[10px] font-bold">↓</kbd>
                    <kbd className="px-1.5 py-0.5 bg-[#F4F5F7] border border-[#DFE1E6] rounded text-[10px] font-bold">↑</kbd>
                  </div>
                  <span>to move through notifications.</span>
                </div>
              </div>
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
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-[#DFE1E6] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {memberView !== 'profile' && (
                  <button
                    onClick={() => {
                      if (memberView === 'edit') setMemberView('detail');
                      else if (memberView === 'detail') setMemberView('members');
                      else setMemberView('profile');
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EBECF0] transition-colors -ml-2">
                    <ChevronLeft className="w-5 h-5 text-[#42526E]" />
                  </button>
                )}
                <h2 className="text-base font-bold text-[#172B4D]">
                  {memberView === 'profile' ? 'Profile'
                    : memberView === 'members' ? 'All members'
                      : memberView === 'detail' ? 'Member details'
                        : 'Edit member'}
                </h2>
              </div>
              <button onClick={() => setProfileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EBECF0] transition-colors -mr-2">
                <X className="w-5 h-5 text-[#42526E]" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">

              {/* ── PROFILE VIEW ── */}
              {memberView === 'profile' && (
                <div className="p-5 space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-[10px] bg-[#0052CC] flex items-center justify-center text-white text-xl font-bold font-sans">
                      {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg text-[#172B4D]">{currentUser?.username || "User Account"}</h3>
                      <p className="text-xs text-[#6B778C]">{currentUser?.email || "No email"}</p>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#DEEBFF] text-[#0052CC] text-[11px] font-bold capitalize">
                          {currentUser?.role || "Member"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[#DFE1E6] opacity-60" />

                  {/* Architect-only actions */}
                  {currentUser?.role === 'Architect' && (
                    <div className="space-y-2">
                      <button onClick={() => { setProfileOpen(false); setSignupOpen(true); setSignupErrors({}); }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-[3px] bg-[#DEEBFF] text-[#0052CC] font-bold text-sm hover:bg-[#B3D4FF] transition-all">
                        <UserPlus className="w-4 h-4" /> Add user
                      </button>
                      <button
                        onClick={() => {
                          setMemberView('members');
                          if (members.length === 0) fetchMembers();
                        }}
                        className="w-full flex items-center gap-2.5 py-2 px-3 rounded-[3px] border border-[#DFE1E6] bg-white hover:bg-[#F4F5F7] text-[#42526E] font-bold text-xs transition-all group">
                        <Users className="w-4 h-4 text-[#6B778C]" />
                        <span className="flex-1 text-left">All members</span>
                        {members.length > 0 && <span className="text-[10px] font-bold text-[#6B778C] bg-[#EBECF0] px-1.5 py-0.5 rounded-full">{members.length}</span>}
                      </button>
                    </div>
                  )}

                  <div className="h-px bg-[#DFE1E6] opacity-60" />

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#6B778C]">Appearance</label>
                    <div className="flex items-center p-1 bg-muted rounded-[3px]">
                      <button onClick={() => { if (darkMode) toggleDark(); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[2px] text-xs font-bold transition-all", !darkMode ? "bg-card shadow-sm text-[#0052CC]" : "text-muted-foreground hover:text-foreground")}>
                        <Sun className="w-3.5 h-3.5" /> Light
                      </button>
                      <button onClick={() => { if (!darkMode) toggleDark(); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[2px] text-xs font-bold transition-all", darkMode ? "bg-card shadow-sm text-[#4C9AFF]" : "text-muted-foreground hover:text-foreground")}>
                        <Moon className="w-3.5 h-3.5" /> Dark
                      </button>
                    </div>
                  </div>

                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-[3px] bg-[#FFEBE6] text-[#DE350B] font-bold text-sm hover:bg-[#FFBDAD] transition-all">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}

              {/* ── MEMBERS LIST VIEW ── */}
              {memberView === 'members' && (
                <div className="p-4 space-y-2">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-6 h-6 border-2 border-[#0052CC]/30 border-t-[#0052CC] rounded-full animate-spin" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-50">
                      <Users className="w-8 h-8 mb-2 text-[#6B778C]" />
                      <p className="text-xs font-bold text-[#172B4D]">No members found</p>
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
                          className="w-full flex items-center gap-3 p-3 rounded-[8px] border border-[#DFE1E6] bg-white hover:bg-[#F4F5F7] transition-all text-left group"
                        >
                          <div className="w-9 h-9 rounded-[8px] bg-[#0052CC] flex items-center justify-center text-white shrink-0 text-base font-bold font-sans">
                            {m.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#172B4D] truncate group-hover:text-[#0052CC]">{m.username}</p>
                            <p className="text-[11px] text-[#6B778C] truncate font-medium">{m.email}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#EBECF0] text-[#42526E] capitalize shrink-0">{m.role}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── DETAIL VIEW ── */}
              {memberView === 'detail' && selectedMember && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 space-y-5">
                  <div className="flex flex-col items-center gap-3 py-1">
                    <div className="w-16 h-16 rounded-[10px] bg-[#0052CC] flex items-center justify-center text-white text-2xl font-bold font-sans">
                      {selectedMember.username?.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg text-[#172B4D]">{selectedMember.username}</h3>
                      <p className="text-xs text-[#6B778C]">{selectedMember.email}</p>
                      <div className="mt-1.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[3px] bg-[#DEEBFF] text-[#0052CC] text-[11px] font-bold capitalize">{selectedMember.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0 rounded-[8px] border border-[#DFE1E6] bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 p-3 hover:bg-[#F4F5F7]">
                      <User className="w-4.5 h-4.5 text-[#6B778C] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#0052CC] font-bold mb-0.5">Username</p>
                        <p className="text-[13px] font-bold text-[#172B4D] truncate">{selectedMember.username}</p>
                      </div>
                    </div>
                    <div className="h-px bg-[#DFE1E6]" />
                    <div className="flex items-center gap-3 p-3 hover:bg-[#F4F5F7]">
                      <Mail className="w-4.5 h-4.5 text-[#6B778C] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#0052CC] font-bold mb-0.5">Email</p>
                        <p className="text-[13px] font-bold text-[#172B4D] truncate">{selectedMember.email}</p>
                      </div>
                    </div>
                    <div className="h-px bg-[#DFE1E6]" />
                    <div className="flex items-center gap-3 p-3 hover:bg-[#F4F5F7]">
                      <Shield className="w-4.5 h-4.5 text-[#6B778C] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#0052CC] font-bold mb-0.5">Role</p>
                        <p className="text-[13px] font-bold text-[#172B4D] capitalize">{selectedMember.role}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setEditMember({ username: selectedMember.username, email: selectedMember.email, role: selectedMember.role }); setEditMemberErrors({}); setMemberView('edit'); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[3px] bg-[#DEEBFF] text-[#0052CC] font-bold text-sm hover:bg-[#B3D4FF] transition-all">
                    <Pencil className="w-4 h-4" /> Edit member
                  </button>
                </motion.div>
              )}

              {/* ── EDIT VIEW ── */}
              {memberView === 'edit' && selectedMember && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#42526E]">Username <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                      <input value={editMember.username} onChange={e => { setEditMember(p => ({ ...p, username: e.target.value })); setEditMemberErrors(p => ({ ...p, username: '' })); }}
                        placeholder="Enter username" className={cn("premium-input !pl-12 !h-9 text-[13px]", editMemberErrors.username && "!border-destructive")} />
                    </div>
                    {editMemberErrors.username && <p className="text-[10px] text-destructive font-bold">{editMemberErrors.username}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#42526E]">Email <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                      <input type="email" value={editMember.email} onChange={e => { setEditMember(p => ({ ...p, email: e.target.value })); setEditMemberErrors(p => ({ ...p, email: '' })); }}
                        placeholder="user@company.com" className={cn("premium-input !pl-12 !h-9 text-[13px]", editMemberErrors.email && "!border-destructive")} />
                    </div>
                    {editMemberErrors.email && <p className="text-[10px] text-destructive font-bold">{editMemberErrors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#42526E] flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#0052CC]" />Role <span className="text-destructive">*</span></label>
                    <AnimatedDropdown options={roles.map(r => ({ label: r, value: r }))} value={editMember.role}
                      onChange={v => { setEditMember(p => ({ ...p, role: v })); setEditMemberErrors(p => ({ ...p, role: '' })); }}
                      placeholder="Select role" error={!!editMemberErrors.role} triggerClassName="!h-9 border-[#DFE1E6] text-[13px]" />
                    {editMemberErrors.role && <p className="text-[10px] text-destructive font-bold">{editMemberErrors.role}</p>}
                  </div>

                  <Button
                    loading={editMemberLoading}
                    onClick={async () => {
                      if (!editMember.username.trim()) { setEditMemberErrors({ username: 'Username is required' }); toast({ title: '⚠️ Validation', description: 'Username is required.', variant: 'destructive' }); return; }
                      if (!editMember.email.trim()) { setEditMemberErrors({ email: 'Email is required' }); toast({ title: '⚠️ Validation', description: 'Email is required.', variant: 'destructive' }); return; }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editMember.email)) { setEditMemberErrors({ email: 'Enter a valid email' }); toast({ title: '⚠️ Validation', description: 'Please enter a valid email.', variant: 'destructive' }); return; }
                      if (!editMember.role) { setEditMemberErrors({ role: 'Role is required' }); toast({ title: '⚠️ Validation', description: 'Please select a role.', variant: 'destructive' }); return; }
                      setEditMemberErrors({});
                      const startTime = Date.now();
                      setEditMemberLoading(true);
                      try {
                        await authService.updateUser(selectedMember.id, editMember);
                        const updated = { ...selectedMember, ...editMember };
                        setSelectedMember(updated);
                        setMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                        const elapsed = Date.now() - startTime;
                        setTimeout(() => {
                          setEditMemberLoading(false);
                          toast({ title: '✅ Member Updated', description: `${editMember.username} has been updated.` });
                          setMemberView('detail');
                        }, Math.max(0, 1500 - elapsed));
                      } catch (err: any) {
                        setEditMemberLoading(false);
                        const msg = (err.message || '').toLowerCase();
                        if (msg.includes('email')) { setEditMemberErrors({ email: 'Email already in use' }); toast({ title: '⚠️ Duplicate Email', description: 'This email is already registered.', variant: 'destructive' }); }
                        else if (msg.includes('username')) { setEditMemberErrors({ username: 'Username already taken' }); toast({ title: '⚠️ Duplicate Username', description: 'This username is already taken.', variant: 'destructive' }); }
                        else { toast({ title: '❌ Update Failed', description: err.message || 'Could not update member.', variant: 'destructive' }); }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 h-10 rounded-[3px] bg-[#0052CC] text-white font-bold text-sm hover:bg-[#0747A6] transition-all disabled:opacity-60 shadow-lg shadow-[#0052CC]/20">
                    <Pencil className="w-4 h-4" /> Save changes
                  </Button>
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
            className="fixed top-0 right-0 z-[110] w-full max-w-sm h-screen bg-card border-l border-[#DFE1E6] shadow-xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-[#DFE1E6] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#DEEBFF] flex items-center justify-center text-[#0052CC] shrink-0 shadow-sm">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#172B4D] leading-none mb-1">Create user account</h2>
                  <p className="text-[11px] text-[#6B778C] font-medium font-sans">Add a new member to your workspace</p>
                </div>
              </div>
              <button onClick={() => setSignupOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EBECF0] transition-colors"><X className="w-5 h-5 text-[#42526E]" /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto scrollbar-hide">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#42526E]">Full name <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                    <input value={signupName} onChange={e => { setSignupName(e.target.value); setSignupErrors(p => ({ ...p, name: "" })); }}
                      placeholder="Enter full name"
                      className={cn("premium-input !pl-12 !h-9 text-[13px]", signupErrors.name && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                  {signupErrors.name && <p className="text-[10px] text-destructive font-bold">{signupErrors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#42526E]">Email address <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
                    <input type="email" value={signupEmail} onChange={e => { setSignupEmail(e.target.value); setSignupErrors(p => ({ ...p, email: "" })); }}
                      placeholder="user@company.com"
                      className={cn("premium-input !pl-12 !h-9 text-[13px]", signupErrors.email && "!border-destructive focus:ring-destructive/20")} />
                  </div>
                  {signupErrors.email && <p className="text-[11px] text-destructive font-bold">{signupErrors.email}</p>}
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#42526E] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0052CC]" />Assign role <span className="text-destructive">*</span>
                  </label>
                  <AnimatedDropdown
                    options={roles.map(r => ({ label: r, value: r }))}
                    value={signupRole}
                    onChange={v => { setSignupRole(v); setSignupErrors(p => ({ ...p, role: "" })); }}
                    placeholder="Select role"
                    error={!!signupErrors.role}
                    triggerClassName="!h-9 border-[#DFE1E6] text-[13px]"
                  />
                  {signupErrors.role && <p className="text-[11px] text-destructive font-bold">{signupErrors.role}</p>}
                </div>

                {/* Password + Confirm — same row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#42526E]">Password <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B778C]" />
                      <input type={showPass ? "text" : "password"} value={signupPassword} onChange={e => { setSignupPassword(e.target.value); setSignupErrors(p => ({ ...p, password: "" })); }}
                        placeholder="Min 6 chars"
                        className={cn("premium-input !pl-9 pr-8 !h-9 text-[13px]", signupErrors.password && "!border-destructive focus:ring-destructive/20")} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]">
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {signupErrors.password && <p className="text-[10px] text-destructive font-bold leading-tight">{signupErrors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#42526E]">Confirm <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B778C]" />
                      <input type={showConf ? "text" : "password"} value={signupConfirm} onChange={e => { setSignupConfirm(e.target.value); setSignupErrors(p => ({ ...p, confirm: "" })); }}
                        placeholder="Re-enter"
                        className={cn("premium-input !pl-9 pr-8 !h-9 text-[13px]", signupErrors.confirm && "!border-destructive focus:ring-destructive/20")} />
                      <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#172B4D]">
                        {showConf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {signupErrors.confirm && <p className="text-[10px] text-destructive font-bold leading-tight">{signupErrors.confirm}</p>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#DFE1E6] bg-[#F4F5F7]/30 flex shrink-0">
                <Button type="submit" loading={signupLoading}
                  className="w-full px-8 py-2.5 bg-[#0052CC] text-white font-bold text-sm rounded-[3px] shadow-lg shadow-[#0052CC]/20 hover:bg-[#0747A6] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 h-10">
                  Create user account <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
