import { useState, useCallback } from "react";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import VoiceButton from "@/components/voice/VoiceButton";
import type { VoiceState } from "@/components/voice/VoiceButton";
import type { AnswerResult, StockQuote } from "@/types/api";

interface VoiceSubmitResult {
  answerData: AnswerResult;
  stockQuote?: StockQuote | null;
  metricData?: { metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null;
}

interface VoiceModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  queries: Array<{ id: string; transcript: string; response_text: string }>;
  onSubmit: (text: string) => Promise<VoiceSubmitResult | void>;
}

const VoiceMode = ({ mode, onModeChange, queries, onSubmit }: VoiceModeProps) => {
  const [textInput, setTextInput] = useState("");
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [answerData, setAnswerData] = useState<AnswerResult | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [metricData, setMetricData] = useState<{ metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const submitQuery = async (text: string) => {
    const result = await onSubmit(text);
    if (result) {
      setAnswerData(result.answerData);
      setStockQuote(result.stockQuote || null);
      setMetricData(result.metricData || null);
      setSelectedOutput(null);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput("");
    await submitQuery(text);
  };

  const handleChipClick = (text: string) => setTextInput(text);

  const handleQuerySelect = (id: string) => {
    const q = queries.find((q) => q.id === id);
    if (q) {
      setSelectedOutput(q.response_text || "No response available.");
      setAnswerData(null);
    }
  };

  const handleTranscript = useCallback(
    (text: string) => {
      setTextInput(text);
      submitQuery(text);
    },
    [onSubmit]
  );

  const handleStateChange = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  return (
    <div className="flex" style={{ height: "calc(100vh - 104px)" }}>
      {/* Left: Query History */}
      <div
        className="overflow-y-auto shrink-0"
        style={{
          width: "20%",
          minWidth: 200,
          background: "#0F1820",
          borderRight: "1px solid #1E2D40",
          padding: "20px 16px",
        }}
      >
        <h3 style={{ color: "#8892A4", fontSize: 10, letterSpacing: "0.2em", marginBottom: 16 }}>
          QUERY HISTORY
        </h3>
        {queries.length === 0 ? (
          <p style={{ color: "#8892A4", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            Your queries will appear here
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {queries.map((q, i) => (
              <button
                key={q.id}
                onClick={() => handleQuerySelect(q.id)}
                className="text-left truncate transition-colors duration-150"
                style={{ color: "#8892A4", fontSize: 12, padding: "6px 0", cursor: "pointer", background: "none", border: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8892A4")}
              >
                Q{i + 1}: {q.transcript?.slice(0, 30) || "..."}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Voice area */}
      <div className="flex flex-col items-center justify-center gap-6" style={{ width: "40%" }}>
        <ModeToggle activeMode={mode} onChange={onModeChange} />

        <VoiceButton
          onTranscript={handleTranscript}
          onStateChange={handleStateChange}
          disabled={false}
        />

        {/* Fallback text input */}
        <form onSubmit={handleTextSubmit} style={{ maxWidth: 280, width: "100%" }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type here..."
            className="w-full focus:outline-none transition-colors duration-200"
            style={{
              background: "rgba(15,24,32,0.8)",
              border: "1px solid #1E2D40",
              borderRadius: 8,
              padding: "10px 14px",
              color: "white",
              fontSize: 13,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#F0A500")}
            onBlur={(e) => (e.target.style.borderColor = "#1E2D40")}
          />
        </form>
      </div>

      {/* Right: Output */}
      <div style={{ width: "40%", borderLeft: "1px solid #1E2D40" }}>
        <OutputPanel
          content={selectedOutput}
          answerData={answerData}
          onChipClick={handleChipClick}
          onGenerateThesis={() => {}}
          onPlotTrend={() => {}}
        />
      </div>
    </div>
  );
};

export default VoiceMode;
