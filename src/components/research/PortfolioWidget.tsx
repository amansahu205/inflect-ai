import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency } from "@/utils/formatters";
import { useTicker } from "@/hooks/useTicker";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const generateSparkline = (dir: "up" | "down") =>
  Array.from({ length: 12 }, (_, i) => ({
    v: 100 + (dir === "up" ? 1 : -1) * Math.sin(i * 0.6) * 2 + (dir === "up" ? i * 0.3 : -i * 0.3) + Math.random(),
  }));

const PortfolioWidget = () => {
  const { totalValue, buyingPower } = usePortfolioStore();
  const { quotes } = useTicker();
  const topStocks = quotes.slice(0, 3);

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <h3 className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
          PORTFOLIO PERFORMANCE
        </h3>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 px-4 py-2" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
        {["Name", "Portfolio", "Price", "Chg %"].map((h) => (
          <span key={h} className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9, letterSpacing: "0.1em" }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="px-2">
        {topStocks.map((q) => {
          const isUp = q.direction === "up";
          const color = isUp ? "#00D68F" : "#E05555";
          return (
            <div key={q.ticker} className="grid grid-cols-4 items-center px-2 py-2.5" style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}>
              <div className="flex items-center gap-2">
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: 24, height: 24, borderRadius: "50%", background: "hsl(var(--muted))", fontSize: 8, color: "hsl(var(--foreground))", fontWeight: 700 }}
                >
                  {q.ticker[0]}
                </div>
                <div>
                  <p style={{ color: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}>{q.ticker}</p>
                </div>
              </div>
              <div style={{ width: 48, height: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateSparkline(q.direction)}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 11 }}>
                ${q.price.toFixed(2)}
              </span>
              <span className="font-mono" style={{ color, fontSize: 11 }}>
                {isUp ? "+" : ""}{q.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioWidget;
