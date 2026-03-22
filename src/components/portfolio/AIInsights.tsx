import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface Insight {
  id: string;
  badge_type: string;
  message: string;
  created_at: string;
}

const SEED_INSIGHTS = [
  { badge_type: "ALERT", message: "NVDA reached target price $540. Review your position." },
  { badge_type: "OPPORTUNITY", message: "Healthcare signal detected. MRNA +4.2% on trial data." },
  { badge_type: "RISK", message: "Market volatility detected. VIX up 8%, TSLA IV elevated." },
  { badge_type: "OPPORTUNITY", message: "AAPL Q4 beat by 3.2%. Gross margin 44.1% YoY." },
];

const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  ALERT: { bg: "rgba(240,165,0,0.15)", text: "hsl(var(--gold))", border: "rgba(240,165,0,0.3)" },
  OPPORTUNITY: { bg: "rgba(0,214,143,0.15)", text: "hsl(var(--bull))", border: "rgba(0,214,143,0.3)" },
  RISK: { bg: "rgba(224,85,85,0.15)", text: "hsl(var(--bear))", border: "rgba(224,85,85,0.3)" },
};

const AIInsights = () => {
  const { user } = useAuthStore();
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!data || data.length === 0) {
        // Seed
        const rows = SEED_INSIGHTS.map((s) => ({ ...s, user_id: user.id }));
        const { data: inserted } = await supabase.from("ai_insights").insert(rows).select();
        if (inserted) setInsights(inserted as Insight[]);
      } else {
        setInsights(data as Insight[]);
      }
    })();
  }, [user]);

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="rounded-2xl relative overflow-hidden" style={{ background: "#0F1820", border: "1px solid hsl(var(--border))", padding: 20 }}>
      {/* Purple glow */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "#7C3AED", filter: "blur(100px)", opacity: 0.08 }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>AI Insights & Alerts</h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "hsl(var(--bull))" }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "hsl(var(--bull))" }} />
        </span>
      </div>

      <div className="space-y-0 relative z-10">
        {insights.map((ins, i) => {
          const style = badgeStyles[ins.badge_type] || badgeStyles.ALERT;
          return (
            <div
              key={ins.id}
              className="flex items-start gap-3 py-3"
              style={{ borderBottom: i < insights.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
            >
              <span
                className="font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5"
                style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
              >
                {ins.badge_type}
              </span>
              <p className="flex-1" style={{ color: "hsl(var(--muted-foreground))", fontSize: 12, lineHeight: 1.4 }}>{ins.message}</p>
              <span className="font-mono shrink-0" style={{ color: "#3d5570", fontSize: 11 }}>{timeAgo(ins.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsights;
