import { useState } from "react";
import MicButton from "./MicButton";
import QueryHistory from "./QueryHistory";
import OutputPanel from "./OutputPanel";

interface VoiceModeProps {
  queries: Array<{ id: string; transcript: string; response_text: string }>;
  onSubmit: (text: string) => Promise<void>;
}

const VoiceMode = ({ queries, onSubmit }: VoiceModeProps) => {
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
  const [textInput, setTextInput] = useState("");
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  const handleMicToggle = () => {
    if (voiceState === "idle") {
      setVoiceState("recording");
      // Voice recording would be wired here
      setTimeout(() => {
        setVoiceState("processing");
        setTimeout(() => setVoiceState("idle"), 3000);
      }, 3000);
    } else if (voiceState === "recording") {
      setVoiceState("processing");
      setTimeout(() => setVoiceState("idle"), 3000);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput("");
    setVoiceState("processing");
    await onSubmit(text);
    setVoiceState("idle");
  };

  const handleChipClick = (text: string) => {
    setTextInput(text);
  };

  const handleQuerySelect = (id: string) => {
    const q = queries.find((q) => q.id === id);
    if (q) setSelectedOutput(q.response_text || "No response available.");
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Query History */}
      <div className="w-1/5 border-r border-border overflow-hidden">
        <QueryHistory queries={queries} onSelect={handleQuerySelect} />
      </div>

      {/* Center: Mic */}
      <div className="w-2/5 flex flex-col items-center justify-center gap-6">
        <MicButton state={voiceState} onToggle={handleMicToggle} />
        <form onSubmit={handleTextSubmit} className="w-full max-w-[280px]">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type here..."
            className="w-full h-9 rounded-lg px-3 text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      </div>

      {/* Right: Output */}
      <div className="w-2/5 border-l border-border overflow-hidden">
        <OutputPanel content={selectedOutput} onChipClick={handleChipClick} />
      </div>
    </div>
  );
};

export default VoiceMode;
