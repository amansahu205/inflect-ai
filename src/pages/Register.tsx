import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixCanvas from "@/components/auth/MatrixCanvas";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/inflect-logo.png";

const passwordChecks = [
  { test: (p: string) => p.length >= 8, msg: "Password must be 8+ characters" },
  { test: (p: string) => /\d/.test(p), msg: "Include at least one number" },
  { test: (p: string) => /[A-Z]/.test(p), msg: "Include at least one uppercase letter" },
];

const Register = () => {
  const { session, loading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState("");

  if (!loading && session) return <Navigate to="/app/research" replace />;

  const validateEmail = () => {
    if (!email) setEmailError("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("Enter a valid email.");
    else setEmailError("");
  };

  const validatePassword = () => {
    const errs = passwordChecks.filter((c) => !c.test(password)).map((c) => c.msg);
    setPasswordErrors(errs);
  };

  const validateConfirm = () => {
    setConfirmError(password !== confirm ? "Passwords don't match" : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    validateEmail();
    validatePassword();
    validateConfirm();

    const pwErrs = passwordChecks.filter((c) => !c.test(password));
    if (!email || emailError || pwErrs.length > 0 || password !== confirm) return;

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setSubmitting(false);

    if (authError) {
      if (authError.status === 409 || authError.status === 422 || authError.message?.toLowerCase().includes("already")) {
        setError("already_exists");
      } else {
        setError("Couldn't create account. Try again.");
      }
      return;
    }
    navigate("/app/research", { replace: true });
  };

  const inputClass =
    "w-full rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors duration-200";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080C14" }}>
      {/* Video background */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/videos/hero_bg.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(8,12,20,0.88)" }} />
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 z-[3]" style={{ height: 120, background: "linear-gradient(to bottom, #080C14, transparent)" }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 z-[3]" style={{ height: 120, background: "linear-gradient(to top, #080C14, transparent)" }} />

      <div
        className="absolute w-full z-[2]"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: 420, padding: "0 16px" }}
      >
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Inflect" style={{ height: 40 }} className="object-contain" />
        </div>

        <div style={{ background: "#0F1820", border: "1px solid #1E2D40", borderRadius: 12, padding: 40, boxShadow: "0 0 40px rgba(240,165,0,0.15)" }}>
          <h1 className="font-display text-xl font-bold text-foreground text-center mb-8">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email" error={emailError}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="you@example.com"
                className={inputClass}
                style={{ background: "#080C14", border: "1px solid #1E2D40", borderRadius: 8, padding: "12px 16px", fontSize: 14 }}
                onFocus={(e) => (e.target.style.borderColor = "#F0A500")}
                onBlurCapture={(e) => (e.target.style.borderColor = "#1E2D40")}
              />
            </Field>

            <Field label="Password" errors={passwordErrors}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
                placeholder="Min 8 chars, 1 number, 1 uppercase"
                className={inputClass}
                style={{ background: "#080C14", border: "1px solid #1E2D40", borderRadius: 8, padding: "12px 16px", fontSize: 14 }}
                onFocus={(e) => (e.target.style.borderColor = "#F0A500")}
                onBlurCapture={(e) => (e.target.style.borderColor = "#1E2D40")}
              />
            </Field>

            <Field label="Confirm Password" error={confirmError}>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={validateConfirm}
                placeholder="Re-enter password"
                className={inputClass}
                style={{ background: "#080C14", border: "1px solid #1E2D40", borderRadius: 8, padding: "12px 16px", fontSize: 14 }}
                onFocus={(e) => (e.target.style.borderColor = "#F0A500")}
                onBlurCapture={(e) => (e.target.style.borderColor = "#1E2D40")}
              />
            </Field>

            {error && error !== "already_exists" && (
              <p style={{ color: "#E05555", fontSize: 12 }}>{error}</p>
            )}
            {error === "already_exists" && (
              <p style={{ color: "#E05555", fontSize: 12 }}>
                Account already exists.{" "}
                <Link to="/login" style={{ color: "#F0A500" }}>Log in instead →</Link>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer transition-colors duration-200"
              style={{
                background: "#F0A500",
                color: "#080C14",
                fontWeight: 700,
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                opacity: submitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = "#D4920A")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F0A500")}
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#8892A4" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium" style={{ color: "#F0A500" }}>Log in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  error,
  errors,
  children,
}: {
  label: string;
  error?: string;
  errors?: string[];
  children: React.ReactNode;
}) => (
  <div>
    <label style={{ color: "#8892A4", fontSize: 12, letterSpacing: "0.05em" }} className="block mb-1.5">
      {label}
    </label>
    {children}
    {error && <p style={{ color: "#E05555", fontSize: 12, marginTop: 6 }}>{error}</p>}
    {errors?.map((e) => (
      <p key={e} style={{ color: "#E05555", fontSize: 12, marginTop: 6 }}>{e}</p>
    ))}
  </div>
);

export default Register;
