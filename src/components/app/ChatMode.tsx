import { useState, useRef, useEffect } from "react";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import { EXAMPLE_QUERIES } from "@/utils/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  onSubmit: (text: string) => Promise<string>;
}

const ChatMode = ({ mode, onModeChange, onSubmit }: ChatModeProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await onSubmit(text);
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      setLatestResponse(response);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (text: string) => setInput(text);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 104px)" }}>
      {/* Mode toggle */}
      <div className="flex justify-end px-8 py-3 shrink-0">
        <ModeToggle activeMode={mode} onChange={onModeChange} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat thread */}
        <div className="flex flex-col" style={{ width: "60%" }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
            {messages.length === 0 && !isTyping ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p style={{ color: "#8892A4", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                  Ask me anything about a stock.
                </p>
                <div className="flex flex-col gap-2">
                  {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleChipClick(q)}
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
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      style={
                        msg.role === "user"
                          ? {
                              background: "rgba(240,165,0,0.1)",
                              border: "1px solid rgba(240,165,0,0.2)",
                              borderRadius: "12px 12px 2px 12px",
                              padding: "12px 16px",
                              maxWidth: "75%",
                              color: "white",
                              fontSize: 14,
                            }
                          : {
                              background: "#0F1820",
                              border: "1px solid #1E2D40",
                              borderRadius: "12px 12px 12px 2px",
                              padding: 16,
                              maxWidth: "85%",
                              color: "white",
                              fontSize: 14,
                              lineHeight: 1.6,
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className="flex items-center gap-1"
                      style={{
                        background: "#0F1820",
                        border: "1px solid #1E2D40",
                        borderRadius: "12px 12px 12px 2px",
                        padding: "12px 16px",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: 8,
                            height: 8,
                            background: "#8892A4",
                            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom input bar */}
          <form
            onSubmit={handleSubmit}
            style={{ padding: "16px 24px", borderTop: "1px solid #1E2D40", background: "#0F1820" }}
          >
            <div
              ref={wrapperRef}
              className="flex items-center gap-3 transition-colors duration-200"
              style={{
                background: "#080C14",
                border: "1px solid #1E2D40",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about a stock..."
                className="flex-1 focus:outline-none"
                style={{ background: "transparent", border: "none", color: "white", fontSize: 14 }}
                onFocus={() => {
                  if (wrapperRef.current) wrapperRef.current.style.borderColor = "#F0A500";
                }}
                onBlur={() => {
                  if (wrapperRef.current) wrapperRef.current.style.borderColor = "#1E2D40";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 flex items-center justify-center transition-colors duration-150"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#F0A500",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  opacity: input.trim() ? 1 : 0.4,
                }}
                onMouseEnter={(e) => {
                  if (input.trim()) e.currentTarget.style.background = "#D4920A";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F0A500")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Output */}
        <div style={{ width: "40%", borderLeft: "1px solid #1E2D40" }}>
          <OutputPanel content={latestResponse} onChipClick={handleChipClick} />
        </div>
      </div>
    </div>
  );
};

export default ChatMode;
