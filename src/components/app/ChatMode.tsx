import { useState, useCallback } from "react";
import ModeToggle from "@/components/ui/ModeToggle";
import OutputPanel from "./OutputPanel";
import ChatThread from "@/components/chat/ChatThread";
import ChatInput from "@/components/chat/ChatInput";
import type { ChatMessage } from "@/components/chat/ChatThread";

interface ChatModeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  onSubmit: (text: string) => Promise<string>;
  messages: ChatMessage[];
  onNewMessage: (userMsg: ChatMessage, assistantMsg: ChatMessage) => void;
}

const ChatMode = ({ mode, onModeChange, onSubmit, messages, onNewMessage }: ChatModeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);

  const handleChipClick = useCallback((text: string) => {
    handleSubmit(text);
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setIsLoading(true);

      try {
        const response = await onSubmit(text);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        };
        onNewMessage(userMsg, assistantMsg);
        setLatestResponse(response);
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Try again.",
          timestamp: new Date().toISOString(),
        };
        onNewMessage(userMsg, errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit, onNewMessage]
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 104px)" }}>
      {/* Mode toggle */}
      <div className="flex justify-end px-8 py-3 shrink-0">
        <ModeToggle activeMode={mode} onChange={onModeChange} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat thread + input */}
        <div className="flex flex-col" style={{ width: "60%" }}>
          <ChatThread messages={messages} isLoading={isLoading} />
          <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
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
