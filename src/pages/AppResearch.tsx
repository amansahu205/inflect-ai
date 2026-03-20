import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";
import TradeModal from "@/components/trading/TradeModal";
import type { ChatMessage } from "@/components/chat/ChatThread";
import type { AnswerResult, ThesisResult, TradeOrder } from "@/types/api";

interface QueryRow {
  id: string;
  transcript: string;
  response_text: string;
}

const mockThesis = (ticker: string): ThesisResult => ({
  ticker,
  fundamental: { signal: "BULLISH", reason: "Strong revenue growth of 122% YoY driven by data center demand.", citation: `${ticker} 10-K · Filed Feb 2024` },
  technical: { signal: "BULLISH", reason: "Price above 50-day and 200-day moving averages with strong momentum.", rsi: 62 },
  sentiment: { signal: "POSITIVE", reason: "Overwhelmingly positive analyst coverage and institutional buying.", score: 0.87 },
  verdict: "HOLD",
  confidence: "HIGH",
});

const detectTradeIntent = (text: string): { side: "buy" | "sell"; ticker: string | null; quantity: number | null } | null => {
  const lower = text.toLowerCase();
  const buyMatch = /\b(buy|purchase|get)\b/i.test(lower);
  const sellMatch = /\b(sell|dump|exit)\b/i.test(lower);
  if (!buyMatch && !sellMatch) return null;
  const ticker = text.match(/\b([A-Z]{1,5})\b/)?.[1] || null;
  const qtyMatch = text.match(/(\d+)\s*(shares?|stocks?)?/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
  return { side: buyMatch ? "buy" : "sell", ticker, quantity };
};

const AppResearch = () => {
  const { user } = useAuthStore();
  const { mode, setMode } = useSessionStore();
  const { buyingPower, setBuyingPower, setTotalValue } = usePortfolioStore();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Trade modal state
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [fillResult, setFillResult] = useState<{ fill_price: number } | null>(null);

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

  const tryCreateOrder = useCallback((text: string): string | null => {
    const trade = detectTradeIntent(text);
    if (!trade) return null;
    if (!trade.ticker) return "Which ticker would you like to trade?";
    if (!trade.quantity) return `How many shares of ${trade.ticker} would you like to ${trade.side}?`;

    const estPrice = 189.5; // Mock — replace with real quote
    const order: TradeOrder = {
      ticker: trade.ticker,
      side: trade.side,
      quantity: trade.quantity,
      order_type: "market",
      estimated_price: estPrice,
      estimated_total: estPrice * trade.quantity,
    };
    setPendingOrder(order);
    return null; // No clarifying question needed
  }, []);

  const handleVoiceSubmit = useCallback(
    async (text: string) => {
      const responseText = `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`;
      const lowerText = text.toLowerCase();
      const isPriceCheck = /what('s| is).*trading|price of|quote/i.test(lowerText);
      const ticker = text.match(/\b[A-Z]{1,5}\b/)?.[0] || null;
      const isMetric = /margin|revenue|earnings|eps|ratio|growth/i.test(lowerText);

      // Check for trade intent
      const clarify = tryCreateOrder(text);

      const answerData: AnswerResult = {
        answer: clarify || responseText,
        intent_type: clarify !== null && !clarify ? "trade" : isPriceCheck ? "price_check" : "research",
        ticker,
        confidence: "HIGH",
        source: isPriceCheck ? "MARKET_DATA" : isMetric ? "SEC_FILING" : "LLM",
        citation: isMetric ? `${ticker || "AAPL"} 10-K · Filed Nov 3 2023 · Item 7` : null,
      };

      const stockQuote = isPriceCheck && ticker ? {
        ticker, price: 189.5, change_percent: 2.4, volume: 52_300_000, direction: "up" as const, timestamp: new Date().toISOString(),
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
          .insert({ user_id: user.id, transcript: text, response_text: clarify || responseText, mode: "voice", intent_type: answerData.intent_type })
          .select("id, transcript, response_text")
          .single();
        if (data) setQueries((prev) => [data as QueryRow, ...prev]);
      }

      return { answerData, stockQuote, metricData };
    },
    [user, tryCreateOrder]
  );

  const handleChatSubmit = useCallback(
    async (text: string): Promise<string> => {
      if (!user) return "Not authenticated.";

      // Check trade intent
      const clarify = tryCreateOrder(text);
      if (clarify) return clarify;

      const responseText = `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`;
      await supabase.from("queries").insert({ user_id: user.id, transcript: text, response_text: responseText, mode: "chat", intent_type: "research" });
      return responseText;
    },
    [user, tryCreateOrder]
  );

  const handleGenerateThesis = useCallback(
    async (ticker: string): Promise<ThesisResult | null> => {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        return mockThesis(ticker);
      } catch {
        toast({ title: "Error", description: "Couldn't generate thesis", variant: "destructive" });
        return null;
      }
    },
    []
  );

  const handleTradeConfirm = useCallback(async () => {
    if (!pendingOrder || !user) return;

    // If already filled, just close
    if (fillResult) {
      setPendingOrder(null);
      setFillResult(null);
      setTradeLoading(false);
      toast({ title: "Trade Complete", description: `${pendingOrder.quantity} ${pendingOrder.ticker} filled at ${fillResult.fill_price.toFixed(2)}` });
      return;
    }

    setTradeLoading(true);
    try {
      // Mock execution — replace with POST to VITE_API_URL/api/v1/trades/execute
      await new Promise((r) => setTimeout(r, 1500));
      const mockFillPrice = pendingOrder.estimated_price * (1 + (Math.random() - 0.5) * 0.001);
      const total = mockFillPrice * pendingOrder.quantity;

      // Update buying power
      const newBP = pendingOrder.side === "buy" ? buyingPower - total : buyingPower + total;
      setBuyingPower(newBP);

      // Persist to DB
      await supabase.from("trades").insert({
        user_id: user.id,
        ticker: pendingOrder.ticker,
        side: pendingOrder.side,
        quantity: pendingOrder.quantity,
        fill_price: mockFillPrice,
        total_value: total,
        status: "filled",
      });

      if (user) {
        await supabase.from("profiles").update({ buying_power: newBP }).eq("id", user.id);
      }

      setFillResult({ fill_price: mockFillPrice });
      // Auto-close handled by TradeModal's useEffect
    } catch {
      setPendingOrder(null);
      setTradeLoading(false);
      toast({ title: "Error", description: "Order failed. Try again.", variant: "destructive" });
    }
  }, [pendingOrder, user, fillResult, buyingPower, setBuyingPower]);

  const handleTradeCancel = useCallback(() => {
    setPendingOrder(null);
    setTradeLoading(false);
    setFillResult(null);
  }, []);

  const handleNewMessage = useCallback((userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  const handleUpdateMessage = useCallback((id: string, update: Partial<ChatMessage>) => {
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...update } : m)));
  }, []);

  return (
    <>
      {mode === "voice" ? (
        <VoiceMode mode={mode} onModeChange={handleModeChange} queries={queries} onSubmit={handleVoiceSubmit} onGenerateThesis={handleGenerateThesis} />
      ) : (
        <ChatMode mode={mode} onModeChange={handleModeChange} onSubmit={handleChatSubmit} messages={chatMessages} onNewMessage={handleNewMessage} onGenerateThesis={handleGenerateThesis} onUpdateMessage={handleUpdateMessage} />
      )}

      <TradeModal
        order={pendingOrder}
        onConfirm={handleTradeConfirm}
        onCancel={handleTradeCancel}
        isLoading={tradeLoading}
        fillResult={fillResult}
      />
    </>
  );
};

export default AppResearch;
