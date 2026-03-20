import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import logo from "@/assets/inflect-logo.png";

const Login = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/app/research";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const attemptsRef = useRef(0);
  const lockedUntilRef = useRef(0);

  if (!loading && session) {
    return <Navigate to="/app/research" replace />;
  }

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email.");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Date.now() < lockedUntilRef.current) {
      setError("Too many attempts. Try again in 15 minutes.");
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 5) {
        lockedUntilRef.current = Date.now() + 15 * 60 * 1000;
        setError("Too many attempts. Try again in 15 minutes.");
      } else {
        setError("Incorrect email or password.");
      }
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080C14" }}>
      <div
        className="w-full rounded-xl"
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

        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-8">Log In</h1>

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
              className="w-full h-11 rounded-lg px-4 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
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
            {submitting ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium" style={{ color: "#F0A500" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
