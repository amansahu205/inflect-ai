import { useState, useRef, useEffect } from "react";
import OutputPanel from "./OutputPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatModeProps {
  onSubmit: (text: string) => Promise<string>;
}

const ChatMode = ({ onSubmit }: ChatModeProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const errMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Try again." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Chat thread */}
      <div className="w-3/5 flex flex-col border-r border-border">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "rgba(240,165,0,0.1)",
                        border: "1px solid rgba(240,165,0,0.2)",
                        borderRadius: "12px 12px 2px 12px",
                        padding: "12px 16px",
                        maxWidth: "75%",
                        color: "white",
                      }
                    : {
                        background: "#0F1820",
                        border: "1px solid #1E2D40",
                        borderRadius: "12px 12px 12px 2px",
                        padding: "16px",
                        maxWidth: "85%",
                        color: "white",
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
                className="flex items-center gap-1 px-4 py-3"
                style={{
                  background: "#0F1820",
                  border: "1px solid #1E2D40",
                  borderRadius: "12px 12px 12px 2px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#8892A4",
                      animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="p-4 shrink-0">
          <div
            className="flex items-center gap-3"
            style={{
              background: "#0F1820",
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
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 disabled:opacity-30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Right: Output panel */}
      <div className="w-2/5 overflow-hidden">
        <OutputPanel content={latestResponse} onChipClick={handleChipClick} />
      </div>
    </div>
  );
};

export default ChatMode;
