import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";
import type { ChatMessage } from "@/components/chat/ChatThread";
import type { AnswerResult } from "@/types/api";

interface QueryRow {
  id: string;
  transcript: string;
  response_text: string;
}

const AppResearch = () => {
  const { user } = useAuthStore();
  const { mode, setMode } = useSessionStore();
  const { setBuyingPower, setTotalValue } = usePortfolioStore();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("buying_power, default_mode")
        .eq("id", user.id)
        .single();
      if (data) {
        setBuyingPower(data.buying_power);
        setTotalValue(data.buying_power);
        if (data.default_mode === "chat" || data.default_mode === "voice") {
          setMode(data.default_mode as "voice" | "chat");
        }
      }
    })();
  }, [user, setBuyingPower, setTotalValue, setMode]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("queries")
        .select("id, transcript, response_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setQueries(data as QueryRow[]);
    })();
  }, [user]);

  const handleModeChange = useCallback(
    async (newMode: "voice" | "chat") => {
      setMode(newMode);
      if (user) {
        await supabase.from("profiles").update({ default_mode: newMode }).eq("id", user.id);
      }
    },
    [user, setMode]
  );

  const handleVoiceSubmit = useCallback(
    async (text: string) => {
      const responseText = `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`;
      const lowerText = text.toLowerCase();

      // Simple intent detection for mock data
      const isPriceCheck = /what('s| is).*trading|price of|quote/i.test(lowerText);
      const ticker = text.match(/\b[A-Z]{1,5}\b/)?.[0] || null;
      const isMetric = /margin|revenue|earnings|eps|ratio|growth/i.test(lowerText);

      const answerData: AnswerResult = {
        answer: responseText,
        intent_type: isPriceCheck ? "price_check" : "research",
        ticker,
        confidence: "HIGH",
        source: isPriceCheck ? "MARKET_DATA" : isMetric ? "SEC_FILING" : "LLM",
        citation: isMetric ? `${ticker || "AAPL"} 10-K · Filed Nov 3 2023 · Item 7` : null,
      };

      const stockQuote = isPriceCheck && ticker ? {
        ticker,
        price: 189.5,
        change_percent: 2.4,
        volume: 52_300_000,
        direction: "up" as const,
        timestamp: new Date().toISOString(),
      } : null;

      const metricData = isMetric ? {
        metric: lowerText.includes("margin") ? "Gross Margin" : "Revenue",
        value: lowerText.includes("margin") ? "44.1%" : "$394.3B",
        period: "Q4 2023",
        change: "+0.8% YoY",
        changeDirection: "up" as const,
      } : null;

      if (user) {
        const { data } = await supabase
          .from("queries")
          .insert({ user_id: user.id, transcript: text, response_text: responseText, mode: "voice", intent_type: answerData.intent_type })
          .select("id, transcript, response_text")
          .single();
        if (data) setQueries((prev) => [data as QueryRow, ...prev]);
      }

      return { answerData, stockQuote, metricData };
    },
    [user]
  );

  const handleChatSubmit = useCallback(
    async (text: string): Promise<string> => {
      if (!user) return "Not authenticated.";
      const responseText = `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`;
      await supabase.from("queries").insert({ user_id: user.id, transcript: text, response_text: responseText, mode: "chat", intent_type: "research" });
      return responseText;
    },
    [user]
  );

  const handleNewMessage = useCallback((userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  return mode === "voice" ? (
    <VoiceMode mode={mode} onModeChange={handleModeChange} queries={queries} onSubmit={handleVoiceSubmit} />
  ) : (
    <ChatMode mode={mode} onModeChange={handleModeChange} onSubmit={handleChatSubmit} messages={chatMessages} onNewMessage={handleNewMessage} />
  );
};

export default AppResearch;
