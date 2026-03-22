import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/inflect-logo.png";

const navLinks = [
  { to: "/app/research", label: "Research" },
  { to: "/app/portfolio", label: "Portfolio" },
];

const NavBar = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = user?.email?.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        height: 56,
        background: "rgba(6, 10, 18, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
      }}
    >
      <img
        src={logo}
        alt="Inflect"
        style={{ height: 32, cursor: "pointer" }}
        className="object-contain"
        onClick={() => navigate("/")}
      />

      <div className="flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors duration-200 font-mono"
              style={{
                color: isActive ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                paddingBottom: 4,
                borderBottom: isActive ? "2px solid hsl(var(--accent))" : "2px solid transparent",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "hsl(var(--foreground))";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "hsl(var(--muted-foreground))";
              }}
            >
              {link.label}
            </Link>
          );
        })}

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0, 212, 255, 0.12)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              color: "hsl(var(--accent))",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {initial}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 glass-panel"
              style={{ padding: 4, minWidth: 140 }}
            >
              <button
                onClick={handleLogout}
                className="w-full text-left transition-colors duration-150"
                style={{ padding: "8px 16px", color: "hsl(var(--muted-foreground))", fontSize: 14, borderRadius: 6 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,212,255,0.06)";
                  e.currentTarget.style.color = "hsl(var(--foreground))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
