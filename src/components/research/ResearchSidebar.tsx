import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/inflect-logo.png";
import type { Query } from "@/types/api";

interface ResearchSidebarProps {
  queries: Query[];
  activeQueryId: string | null;
  onSelect: (query: Query) => void;
  onClear?: () => void;
}

const navItems = [
  { icon: "home", label: "Home", to: "/" },
  { icon: "research", label: "Research", to: "/app/research" },
  { icon: "portfolio", label: "Portfolio", to: "/app/portfolio" },
];

const iconMap: Record<string, JSX.Element> = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  research: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  portfolio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const ResearchSidebar = ({ queries, activeQueryId, onSelect, onClear }: ResearchSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(10,14,22,0.95)", borderRight: "1px solid hsl(var(--border))" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 shrink-0" style={{ height: 56 }}>
        <img src={logo} alt="Inflect" style={{ height: 28 }} className="object-contain" />
        <button
          onClick={handleLogout}
          className="ml-auto transition-colors"
          style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}
          title="Log out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 mt-2 shrink-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left w-full"
              style={{
                background: isActive ? "hsl(var(--primary) / 0.12)" : "transparent",
                color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {iconMap[item.icon]}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* History divider */}
      <div className="flex items-center justify-between px-4 mt-6 mb-2 shrink-0">
        <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          HISTORY
        </span>
        {queries.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="font-mono transition-colors"
            style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, background: "none", border: "none", cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Query history */}
      <div className="flex-1 overflow-y-auto px-2">
        {queries.length === 0 ? (
          <p className="font-mono text-center py-8" style={{ color: "hsl(var(--border))", fontSize: 11 }}>
            No queries yet
          </p>
        ) : (
          queries.slice(0, 15).map((q) => {
            const isActive = q.id === activeQueryId;
            return (
              <button
                key={q.id}
                onClick={() => onSelect(q)}
                className="w-full text-left px-3 py-2 rounded-md mb-0.5 transition-all duration-150"
                style={{
                  background: isActive ? "hsl(var(--primary) / 0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                }}
              >
                <p className="truncate" style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", fontSize: 12 }}>
                  {q.transcript?.slice(0, 40) || "..."}
                </p>
                <span className="font-mono" style={{ color: "hsl(var(--border))", fontSize: 9 }}>
                  {timeAgo(q.created_at)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResearchSidebar;
