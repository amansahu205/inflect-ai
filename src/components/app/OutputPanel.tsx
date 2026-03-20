import { EXAMPLE_QUERIES } from "@/utils/constants";
import AnswerCard from "@/components/research/AnswerCard";
import StockCard from "@/components/charts/StockCard";
import MetricCard from "@/components/charts/MetricCard";
import type { AnswerResult, StockQuote } from "@/types/api";

interface MetricData {
  metric: string;
  value: string;
  period: string;
  change?: string;
  changeDirection?: "up" | "down";
}

interface OutputPanelProps {
  content: string | null;
  answerData?: AnswerResult | null;
  stockQuote?: StockQuote | null;
  metricData?: MetricData | null;
  onChipClick: (text: string) => void;
  onGenerateThesis?: () => void;
  onPlotTrend?: () => void;
}

const OutputPanel = ({ content, answerData, stockQuote, metricData, onChipClick, onGenerateThesis, onPlotTrend }: OutputPanelProps) => {
  const hasData = answerData || stockQuote || metricData;

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ padding: 24 }}>
      {hasData ? (
        <div className="flex flex-col gap-4">
          {/* Price check → StockCard */}
          {stockQuote && <StockCard quote={stockQuote} />}

          {/* Metric → MetricCard */}
          {metricData && (
            <MetricCard
              metric={metricData.metric}
              value={metricData.value}
              period={metricData.period}
              change={metricData.change}
              changeDirection={metricData.changeDirection}
              source={answerData?.source || "LLM"}
              citation={answerData?.citation || undefined}
            />
          )}

          {/* AnswerCard (always if answerData) */}
          {answerData && (
            <AnswerCard
              key={answerData.answer}
              answer={answerData.answer}
              source={answerData.source}
              citation={answerData.citation}
              confidence={answerData.confidence}
              ticker={answerData.ticker}
              onGenerateThesis={onGenerateThesis || (() => {})}
              onPlotTrend={onPlotTrend || (() => {})}
            />
          )}
        </div>
      ) : content ? (
        <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{content}</p>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p style={{ color: "#8892A4", fontSize: 14, marginBottom: 24 }}>Ask a question to see results</p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => onChipClick(q)}
                className="text-left transition-colors duration-150"
                style={{
                  border: "1px solid rgba(240,165,0,0.3)",
                  background: "rgba(240,165,0,0.05)",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "#F0A500",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.05)")}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
