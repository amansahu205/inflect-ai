import { useTicker } from "@/hooks/useTicker";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const generateSparkline = (dir: "up" | "down") =>
  Array.from({ length: 12 }, (_, i) => ({
    v: 100 + (dir === "up" ? 1 : -1) * Math.sin(i * 0.6) * 2 + (dir === "up" ? i * 0.3 : -i * 0.3) + Math.random(),
  }));

const MarketDataWidget = () => {
  const { quotes } = useTicker();
  const display = quotes.slice(0, 4);

  return (
    <div className="glass rounded-xl p-4" style={{ border: "1px solid hsl(var(--border))" }}>
      <h3 className="font-mono mb-3" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.15em" }}>
        MARKET DATA
      </h3>
      <div className="flex flex-col gap-2.5">
        {display.map((q) => {
          const isUp = q.direction === "up";
          const color = isUp ? "#00D68F" : "#E05555";
          return (
            <div key={q.ticker} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <span className="font-mono" style={{ fontSize: 8, color, fontWeight: 700 }}>
                  {q.ticker.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono truncate" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}>
                    {q.ticker}
                  </span>
                  <span className="font-mono" style={{ color: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }}>
                    ${q.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div style={{ width: 40, height: 16 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateSparkline(q.direction)}>
                        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="font-mono" style={{ color, fontSize: 10 }}>
                    {isUp ? "+" : ""}{q.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketDataWidget;
