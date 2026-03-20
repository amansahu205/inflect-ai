import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/inflect-logo.png";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const Register = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  if (!loading && session) {
    return <Navigate to="/app/research" replace />;
  }

  const validateEmail = () => {
    if (!email) setEmailError("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("Enter a valid email.");
    else setEmailError("");
  };

  const validatePassword = () => {
    if (!password) setPasswordError("Password is required.");
    else if (!passwordRegex.test(password))
      setPasswordError("Password must be 8+ chars with one number and one uppercase.");
    else setPasswordError("");
  };

  const validateConfirm = () => {
    if (password !== confirm) setConfirmError("Passwords don't match.");
    else setConfirmError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    validateEmail();
    validatePassword();
    validateConfirm();

    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (!passwordRegex.test(password)) return;
    if (password !== confirm) return;

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setSubmitting(false);

    if (authError) {
      if (authError.status === 409 || authError.message?.toLowerCase().includes("already")) {
        setError("Account already exists. Log in →");
      } else {
        setError("Couldn't create account. Try again.");
      }
      return;
    }

    navigate("/app/research", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080C14" }}>
      <div
        className="w-full"
        style={{
          maxWidth: 420,
          background: "#0F1820",
          border: "1px solid #1E2D40",
          borderRadius: 12,
          padding: 40,
        }}
      >
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Inflect" className="h-10 object-contain" />
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-8">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validateEmail}
              className="w-full h-11 rounded-lg px-4 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
            {emailError && <p className="text-xs mt-1" style={{ color: "#E05555" }}>{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              className="w-full h-11 rounded-lg px-4 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
            {passwordError && <p className="text-xs mt-1" style={{ color: "#E05555" }}>{passwordError}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={validateConfirm}
              className="w-full h-11 rounded-lg px-4 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
            {confirmError && <p className="text-xs mt-1" style={{ color: "#E05555" }}>{confirmError}</p>}
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#E05555" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 font-semibold text-sm transition-colors disabled:opacity-50"
            style={{ background: "#F0A500", color: "#080C14", borderRadius: 8 }}
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-medium" style={{ color: "#F0A500" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
