import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Rocket, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(errs).join(" • "), variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setCountdown(60);
      toast({ title: "📧 OTP Sent", description: `A 6-digit code has been sent to ${email}` });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors(p => ({ ...p, otp: "" }));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const otpStr = otp.join("");
    if (otpStr.length < 6) errs.otp = "Enter the complete 6-digit OTP";
    if (!newPassword.trim()) errs.newPassword = "New password is required";
    else if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword.trim()) errs.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: "⚠️ Validation Error", description: Object.values(errs).join(" • "), variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "✅ Password Reset", description: "Your password has been updated successfully." });
      window.location.href = "/login";
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
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Reset Password</h1>
          <p className="text-xl text-white/80 font-medium">We'll help you get back in</p>
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

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Forgot Password</h2>
                <p className="text-sm text-muted-foreground mb-8">Enter your email to receive a verification code</p>

                <form onSubmit={handleSendOtp} className="space-y-5">
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

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Verify & Reset</h2>
                <p className="text-sm text-muted-foreground mb-8">Enter the OTP sent to <span className="font-semibold text-foreground">{email}</span></p>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Verification Code</label>
                    <div className="flex items-center justify-between gap-2">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => otpRefs.current[i] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className={cn(
                            "w-12 h-14 text-center text-xl font-bold border-2 rounded-xl bg-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                            errors.otp ? "border-destructive" : "border-input"
                          )}
                        />
                      ))}
                    </div>
                    {errors.otp && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.otp}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{countdown > 0 ? `Resend in ${countdown}s` : ""}</span>
                      {countdown === 0 && (
                        <button type="button" onClick={() => { setCountdown(60); toast({ title: "📧 OTP Resent" }); }}
                          className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Resend OTP</button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: "" })); }}
                        placeholder="Min 6 characters"
                        className={cn("premium-input pl-11 pr-11", errors.newPassword && "border-destructive focus:ring-destructive/20 focus:border-destructive")} />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.newPassword}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                        placeholder="Re-enter password"
                        className={cn("premium-input pl-11 pr-11", errors.confirmPassword && "border-destructive focus:ring-destructive/20 focus:border-destructive")} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-destructive" />{errors.confirmPassword}</p>}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
