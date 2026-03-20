import { useState } from "react";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import { EXAMPLE_QUERIES } from "@/utils/constants";

interface VoiceModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  queries: Array<{ id: string; transcript: string; response_text: string }>;
  onSubmit: (text: string) => Promise<void>;
}

const VoiceMode = ({ mode, onModeChange, queries, onSubmit }: VoiceModeProps) => {
  const [textInput, setTextInput] = useState("");
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput("");
    await onSubmit(text);
  };

  const handleChipClick = (text: string) => setTextInput(text);

  const handleQuerySelect = (id: string) => {
    const q = queries.find((q) => q.id === id);
    if (q) setSelectedOutput(q.response_text || "No response available.");
  };

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
                style={{ color: "#8892A4", fontSize: 12, padding: "6px 0", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8892A4")}
              >
                Q{i + 1}: {q.transcript?.slice(0, 30) || "..."}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Mic area */}
      <div className="flex flex-col items-center justify-center gap-6" style={{ width: "40%" }}>
        <ModeToggle activeMode={mode} onChange={onModeChange} />

        {/* Mic button */}
        <button
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(240,165,0,0.2) 0%, rgba(240,165,0,0.05) 70%, transparent 100%)",
            border: "2px solid #F0A500",
            cursor: "pointer",
            animation: "goldPulse 2s ease-in-out infinite",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>

        <p style={{ color: "#8892A4", fontSize: 13 }}>Click to speak</p>

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
        <OutputPanel content={selectedOutput} onChipClick={handleChipClick} />
      </div>
    </div>
  );
};

export default VoiceMode;
