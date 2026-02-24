import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Rocket, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const roles = ["Admin", "Manager", "Developer"];

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password.trim()) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!confirmPassword.trim()) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!role) e.role = "Please select a role";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(e).join(" • "), variant: "destructive" });
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "🎉 Account Created", description: "Welcome to TrackFlow!" });
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-info items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">TrackFlow</h1>
          <p className="text-xl text-white/80 font-medium">Join Your Team Today</p>
          <p className="text-sm text-white/60 mt-4 leading-relaxed">Create your account and start managing projects efficiently.</p>
        </motion.div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl">TrackFlow</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-8">Fill in the details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                  placeholder="you@company.com"
                  className={cn("premium-input pl-11", errors.email && "border-destructive focus:ring-destructive/20 focus:border-destructive")} />
              </div>
              {errors.email && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                  placeholder="Min 6 characters"
                  className={cn("premium-input pl-11 pr-11", errors.password && "border-destructive focus:ring-destructive/20 focus:border-destructive")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                  placeholder="Re-enter your password"
                  className={cn("premium-input pl-11 pr-11", errors.confirmPassword && "border-destructive focus:ring-destructive/20 focus:border-destructive")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.confirmPassword}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" />Role</label>
              <select value={role} onChange={e => { setRole(e.target.value); setErrors(p => ({ ...p, role: "" })); }}
                className={cn("premium-select", errors.role && "border-destructive focus:ring-destructive/20 focus:border-destructive")}>
                <option value="">Select a role</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.role}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
