import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Rocket, LayoutDashboard, Ticket, FileText, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Ticket, text: "Issue & Bug Tracking" },
  { icon: LayoutDashboard, text: "Project Boards" },
  { icon: FileText, text: "Notes & Checklists" },
  { icon: Users, text: "Team Collaboration" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Apply saved theme on login page and handle auto-redirect
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // If we have token + user, redirect to dashboard
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    if (token && user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password.trim()) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: "Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login({ email, password });
      setLoading(false);
      toast({ title: "Welcome back!", description: "You have signed in successfully.", variant: "success" });
      navigate("/");
    } catch (error: any) {
      setLoading(false);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Blue Brand Panel ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0052CC 0%, #0065FF 55%, #2684FF 100%)' }}
      >
        {/* Background glow blobs */}
        <div className="absolute top-[-60px] left-[-60px] w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: '#fff' }} />
        <div className="absolute bottom-[-40px] right-[-40px] w-96 h-96 rounded-full opacity-[0.08] blur-3xl" style={{ background: '#fff' }} />

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 text-center max-w-sm">
          {/* Rocket icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)' }}
          >
            {/* TrackFlow logo — same as HeaderNav, scaled up */}
            <div className="w-11 h-11 rounded-[6px] bg-white/90 flex items-center justify-center shadow-sm">
              <div className="w-5 h-5 border-[3px] border-[#0052CC] rounded-[2px]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-[40px] font-extrabold text-white mb-3 tracking-tight leading-tight">
              Track Flow
            </h1>
            <p className="text-[17px] font-semibold text-white/85 mb-4">
              Smart Project &amp; Ticket Management
            </p>
            <p className="text-[13px] text-white/55 leading-relaxed">
              Streamline your workflow with powerful project tracking,<br />
              ticket management, and team collaboration tools.
            </p>
          </motion.div>
        </div>

        {/* Bottom watermark */}
        <p className="absolute bottom-6 text-[11px] text-white/30">
          © {new Date().getFullYear()} TrackFlow · All rights reserved
        </p>
      </motion.div>


      {/* ── RIGHT: Login Form ──────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-12"
        style={{ background: 'var(--jira-page-bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-[3px] bg-[#0052CC] flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 border-2 border-white rounded-[1px]" />
            </div>
            <span className="font-bold text-[18px] tracking-tight" style={{ color: 'var(--jira-text-primary)' }}>TrackFlow</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2
              className="text-[26px] font-bold leading-tight mb-1"
              style={{ color: 'var(--jira-text-primary)' }}
            >
              Welcome Back
            </h2>
            <p className="text-[14px]" style={{ color: 'var(--jira-text-muted)' }}>
              Sign in to continue to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--jira-text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--jira-text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  autoFocus
                  onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: "" })); }}
                  placeholder="you@company.com"
                  className={cn(
                    "w-full pl-10 pr-3 h-[40px] text-[14px] rounded-[3px] border outline-none transition-all duration-150",
                    "focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF]",
                    errors.email ? "border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-[#A5ADBA]"
                  )}
                  style={{
                    background: 'var(--jira-surface)',
                    color: 'var(--jira-text-primary)',
                  }}
                />
              </div>
              {errors.email && <p className="text-[12px] text-red-500 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--jira-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--jira-text-muted)' }} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full pl-10 pr-10 h-[40px] text-[14px] rounded-[3px] border outline-none transition-all duration-150",
                    "focus:ring-2 focus:ring-[#4C9AFF]/20 focus:border-[#4C9AFF]",
                    errors.password ? "border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.1)]" : "border-[#A5ADBA]"
                  )}
                  style={{
                    background: 'var(--jira-surface)',
                    color: 'var(--jira-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--jira-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-500 font-medium">{errors.password}</p>}
            </div>

            {/* Sign In button */}
            <Button
              type="submit"
              id="login-submit"
              loading={loading}
              className="w-full h-11 rounded-[3px] text-[14px] font-bold bg-[#0052CC] hover:bg-[#0747A6] text-white border-none shadow-none transition-all duration-150 mt-2"
            >
              {!loading && "Sign In"}
            </Button>
          </form>

          <p className="text-[12px] text-center mt-6" style={{ color: 'var(--jira-text-subtle)' }}>
            Don't have an account? Contact your administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
