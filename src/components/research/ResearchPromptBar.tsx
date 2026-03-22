import { useState, useRef, useCallback } from "react";
import type { VoiceState } from "@/components/voice/VoiceButton";

interface ResearchPromptBarProps {
  onSubmit: (text: string) => void;
  onMicClick: () => void;
  voiceState: VoiceState;
  disabled?: boolean;
}

const ResearchPromptBar = ({ onSubmit, onMicClick, voiceState, disabled }: ResearchPromptBarProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = value.trim().length > 0 && !disabled;
  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "processing";

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  }, [canSubmit, value, onSubmit]);

  return (
    <div
      className="glass rounded-xl flex items-center gap-3 px-4"
      style={{
        height: 56,
        border: "1px solid hsl(var(--border))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle glow line at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)",
        }}
      />

      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
        placeholder="Prompt inflect your here..."
        disabled={disabled}
        className="flex-1 focus:outline-none bg-transparent font-mono"
        style={{ color: "hsl(var(--foreground))", fontSize: 13, border: "none" }}
      />

      {/* Mic button */}
      <button
        onClick={onMicClick}
        disabled={isProcessing}
        className="shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: isRecording
            ? "radial-gradient(circle, rgba(224,85,85,0.3), rgba(224,85,85,0.1))"
            : "radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))",
          border: `1.5px solid ${isRecording ? "#E05555" : "hsl(var(--primary) / 0.5)"}`,
          cursor: isProcessing ? "default" : "pointer",
          boxShadow: isRecording ? "0 0 20px rgba(224,85,85,0.4)" : "0 0 12px hsl(var(--primary) / 0.2)",
        }}
      >
        {isProcessing ? (
          <div style={{ width: 14, height: 14, border: "2px solid hsl(var(--primary) / 0.3)", borderTopColor: "hsl(var(--primary))", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRecording ? "#E05555" : "hsl(var(--primary))"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: canSubmit ? "hsl(var(--primary))" : "hsl(var(--muted))",
          cursor: canSubmit ? "pointer" : "default",
          opacity: canSubmit ? 1 : 0.4,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canSubmit ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};

export default ResearchPromptBar;
