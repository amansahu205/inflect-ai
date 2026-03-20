import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import PositionsTable from "@/components/trading/PositionsTable";
import TradeHistory from "@/components/trading/TradeHistory";
import type { Position, Trade } from "@/types/api";

const INITIAL_CAPITAL = 100_000;

const AppPortfolio = () => {
  const { user } = useAuthStore();
  const { positions, trades, buyingPower, setPositions, setTrades, setBuyingPower } = usePortfolioStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      const [posRes, tradeRes, profileRes] = await Promise.all([
        supabase.from("positions").select("*").eq("user_id", user.id),
        supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("buying_power").eq("id", user.id).single(),
      ]);

      if (posRes.data) setPositions(posRes.data as unknown as Position[]);
      if (tradeRes.data) setTrades(tradeRes.data as unknown as Trade[]);
      if (profileRes.data) setBuyingPower(profileRes.data.buying_power);
      setIsLoading(false);
    })();
  }, [user, setPositions, setTrades, setBuyingPower]);

  const positionsValue = positions.reduce((sum, p) => {
    const mockPrice = p.avg_cost_basis * (1 + (Math.random() - 0.45) * 0.1);
    return sum + mockPrice * p.quantity;
  }, 0);
  const totalValue = positionsValue + buyingPower;
  const allTimeReturn = ((totalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
  const isReturnPositive = allTimeReturn >= 0;

  const summaryCards = [
    { label: "TOTAL VALUE", value: formatCurrency(totalValue), color: "white" },
    { label: "BUYING POWER", value: formatCurrency(buyingPower), color: "#F0A500" },
    { label: "ALL-TIME RETURN", value: formatPercent(allTimeReturn), color: isReturnPositive ? "#00D68F" : "#E05555" },
    { label: "TODAY'S P&L", value: "+$0.00", color: "#8892A4" },
  ];

  return (
    <>
      {/* Video background */}
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover z-0" style={{ opacity: 0.15 }}>
        <source src="/videos/dashboard_full.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1]" style={{ background: "rgba(8,12,20,0.92)" }} />

      <div className="relative z-[2]" style={{ padding: "24px 32px" }}>
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="inflect-card"
            style={{ background: "#0F1820", border: "1px solid #1E2D40", borderRadius: 12, padding: 20 }}
          >
            <p style={{ color: "#8892A4", fontSize: 10, letterSpacing: "0.2em", marginBottom: 8 }}>{card.label}</p>
            {isLoading ? (
              <div
                style={{
                  height: 32,
                  background: "linear-gradient(90deg, #1E2D40 25%, #253548 50%, #1E2D40 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  borderRadius: 4,
                }}
              />
            ) : (
              <p className="font-mono" style={{ color: card.color, fontSize: 24, fontWeight: 700 }}>{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ color: "#8892A4", fontSize: 10, letterSpacing: "0.2em", marginBottom: 16 }}>POSITIONS</h3>
      <PositionsTable positions={positions} isLoading={isLoading} />

      <h3 style={{ color: "#8892A4", fontSize: 10, letterSpacing: "0.2em", marginTop: 32, marginBottom: 16 }}>TRADE HISTORY</h3>
      <TradeHistory trades={trades.slice(0, 20)} isLoading={isLoading} />
      </div>
    </>
  );
};

export default AppPortfolio;
