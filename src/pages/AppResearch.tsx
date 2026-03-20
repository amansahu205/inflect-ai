import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { analyzeQuery } from "@/api/query";
import { getQuote } from "@/api/market";
import { executeTrade as executeTradeApi } from "@/api/trades";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";
import TradeModal from "@/components/trading/TradeModal";
import type { ChatMessage } from "@/components/chat/ChatThread";
import type { AnswerResult, ThesisResult, TradeOrder, StockQuote } from "@/types/api";
import type { AnalyzeResult } from "@/api/query";

interface QueryRow {
  id: string;
  transcript: string;
  response_text: string;
}

// Whether the FastAPI backend is available
const USE_BACKEND = !!import.meta.env.VITE_API_URL;

// --- Mock fallbacks when no backend ---
const mockAnalyze = (text: string): AnalyzeResult => {
  const lower = text.toLowerCase();
  const isPriceCheck = /what('s| is).*trading|price of|quote/i.test(lower);
  const ticker = text.match(/\b[A-Z]{1,5}\b/)?.[0] || null;
  const isMetric = /margin|revenue|earnings|eps|ratio|growth/i.test(lower);
  const isTrade = /\b(buy|sell|purchase|dump)\b/i.test(lower);
  return {
    intent_type: isTrade ? "trade" : isPriceCheck ? "price_check" : "research",
    ticker,
    metric: isMetric ? (lower.includes("margin") ? "Gross Margin" : "Revenue") : null,
    timeframe: null,
    confidence: 0.92,
    answer: `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`,
    source: isPriceCheck ? "MARKET_DATA" : isMetric ? "SEC_FILING" : "LLM",
    citation: isMetric ? `${ticker || "AAPL"} 10-K · Filed Nov 3 2023 · Item 7` : null,
    confidence_level: "HIGH",
  };
};

const mockQuote = (ticker: string): StockQuote => ({
  ticker,
  price: 189.5,
  change_percent: 2.4,
  volume: 52_300_000,
  direction: "up",
  timestamp: new Date().toISOString(),
});

const mockThesis = (ticker: string): ThesisResult => ({
  ticker,
  fundamental: { signal: "BULLISH", reason: "Strong revenue growth of 122% YoY driven by data center demand.", citation: `${ticker} 10-K · Filed Feb 2024` },
  technical: { signal: "BULLISH", reason: "Price above 50-day and 200-day moving averages with strong momentum.", rsi: 62 },
  sentiment: { signal: "POSITIVE", reason: "Overwhelmingly positive analyst coverage and institutional buying.", score: 0.87 },
  verdict: "HOLD",
  confidence: "HIGH",
});

// --- Browser TTS ---
function speakText(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

// --- Detect trade intent ---
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
  const { mode, setMode, ticker: sessionTicker, timeframe: sessionTimeframe, setTicker, addAnswer, sessionId } = useSessionStore();
  const { buyingPower, setBuyingPower, setTotalValue } = usePortfolioStore();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Trade modal state
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [fillResult, setFillResult] = useState<{ fill_price: number } | null>(null);

  // Voice TTS state callback
  const [voiceStateOverride, setVoiceStateOverride] = useState<"idle" | "playing" | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("buying_power, default_mode").eq("id", user.id).single();
      if (data) {
        setBuyingPower(data.buying_power);
        setTotalValue(data.buying_power);
        if (data.default_mode === "chat" || data.default_mode === "voice") setMode(data.default_mode as "voice" | "chat");
      }
    })();
  }, [user, setBuyingPower, setTotalValue, setMode]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("queries").select("id, transcript, response_text").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setQueries(data as QueryRow[]);
    })();
  }, [user]);

  const handleModeChange = useCallback(async (newMode: "voice" | "chat") => {
    setMode(newMode);
    if (user) await supabase.from("profiles").update({ default_mode: newMode }).eq("id", user.id);
  }, [user, setMode]);

  // --- Core query pipeline ---
  const runPipeline = useCallback(async (text: string): Promise<{
    result: AnalyzeResult;
    quote?: StockQuote | null;
    metricData?: { metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null;
  }> => {
    // Step 1: Analyze
    let result: AnalyzeResult;
    try {
      result = USE_BACKEND
        ? await analyzeQuery(text, { ticker: sessionTicker, timeframe: sessionTimeframe })
        : mockAnalyze(text);
    } catch {
      result = mockAnalyze(text);
    }

    // Step 2: Update session
    if (result.ticker) setTicker(result.ticker);

    // Step 3: Route by intent
    let quote: StockQuote | null = null;
    let metricData: { metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null = null;

    if (result.intent_type === "price_check" && result.ticker) {
      try {
        quote = USE_BACKEND ? await getQuote(result.ticker) : mockQuote(result.ticker);
      } catch {
        quote = mockQuote(result.ticker);
      }
    }

    if (result.metric) {
      metricData = {
        metric: result.metric,
        value: result.metric.includes("Margin") ? "44.1%" : "$394.3B",
        period: result.timeframe || "Q4 2023",
        change: "+0.8% YoY",
        changeDirection: "up",
      };
    }

    // Step 4: Save to Supabase
    if (user) {
      const { data } = await supabase.from("queries").insert({
        user_id: user.id,
        session_id: sessionId,
        transcript: text,
        intent_type: result.intent_type,
        response_text: result.answer,
        ticker: result.ticker,
        mode,
      }).select("id, transcript, response_text").single();
      if (data) setQueries((prev) => [data as QueryRow, ...prev]);
    }

    // Store answer
    const answerResult: AnswerResult = {
      answer: result.answer,
      intent_type: result.intent_type,
      ticker: result.ticker,
      confidence: result.confidence_level,
      source: result.source as AnswerResult["source"],
      citation: result.citation,
    };
    addAnswer(answerResult);

    return { result, quote, metricData };
  }, [user, sessionTicker, sessionTimeframe, setTicker, addAnswer, sessionId, mode]);

  // --- Voice mode submit ---
  const handleVoiceSubmit = useCallback(async (text: string) => {
    const { result, quote, metricData } = await runPipeline(text);

    // Handle trade intent
    if (result.intent_type === "trade") {
      const trade = detectTradeIntent(text);
      if (trade?.ticker && trade?.quantity) {
        const estPrice = quote?.price || 189.5;
        setPendingOrder({
          ticker: trade.ticker, side: trade.side, quantity: trade.quantity,
          order_type: "market", estimated_price: estPrice, estimated_total: estPrice * trade.quantity,
        });
      }
    }

    const answerData: AnswerResult = {
      answer: result.answer,
      intent_type: result.intent_type,
      ticker: result.ticker,
      confidence: result.confidence_level,
      source: result.source as AnswerResult["source"],
      citation: result.citation,
    };

    // Browser TTS for voice mode
    if (mode === "voice") {
      const ttsText = result.intent_type === "price_check" && quote
        ? `${quote.ticker} is at $${quote.price.toFixed(2)}, ${quote.direction} ${Math.abs(quote.change_percent).toFixed(1)} percent today`
        : result.answer;

      speakText(
        ttsText,
        () => setVoiceStateOverride("playing"),
        () => setVoiceStateOverride("idle")
      );
    }

    return { answerData, stockQuote: quote, metricData };
  }, [runPipeline, mode]);

  // --- Chat mode submit ---
  const handleChatSubmit = useCallback(async (text: string): Promise<string> => {
    if (!user) return "Not authenticated.";

    const { result } = await runPipeline(text);

    // Handle trade intent in chat
    if (result.intent_type === "trade") {
      const trade = detectTradeIntent(text);
      if (trade?.ticker && trade?.quantity) {
        setPendingOrder({
          ticker: trade.ticker, side: trade.side, quantity: trade.quantity,
          order_type: "market", estimated_price: 189.5, estimated_total: 189.5 * trade.quantity,
        });
      } else if (trade && !trade.ticker) {
        return "Which ticker would you like to trade?";
      } else if (trade && !trade.quantity) {
        return `How many shares of ${trade.ticker} would you like to ${trade.side}?`;
      }
    }

    return result.answer;
  }, [user, runPipeline]);

  // --- Thesis generation ---
  const handleGenerateThesis = useCallback(async (ticker: string): Promise<ThesisResult | null> => {
    try {
      if (USE_BACKEND) {
        const { apiCall } = await import("@/api/client");
        return await apiCall<ThesisResult>("/api/v1/thesis/generate", {
          method: "POST",
          body: JSON.stringify({ ticker }),
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
      return mockThesis(ticker);
    } catch {
      toast({ title: "Error", description: "Couldn't generate thesis", variant: "destructive" });
      return null;
    }
  }, []);

  // --- Trade execution ---
  const handleTradeConfirm = useCallback(async () => {
    if (!pendingOrder || !user) return;
    if (fillResult) {
      setPendingOrder(null); setFillResult(null); setTradeLoading(false);
      toast({ title: "Trade Complete", description: `${pendingOrder.quantity} ${pendingOrder.ticker} filled at $${fillResult.fill_price.toFixed(2)}` });
      return;
    }

    setTradeLoading(true);
    try {
      let fill: { fill_price: number; total_value: number };
      if (USE_BACKEND) {
        fill = await executeTradeApi({ ticker: pendingOrder.ticker, side: pendingOrder.side, quantity: pendingOrder.quantity, order_type: "market" });
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        const fp = pendingOrder.estimated_price * (1 + (Math.random() - 0.5) * 0.001);
        fill = { fill_price: fp, total_value: fp * pendingOrder.quantity };
      }

      const newBP = pendingOrder.side === "buy" ? buyingPower - fill.total_value : buyingPower + fill.total_value;
      setBuyingPower(newBP);

      await supabase.from("trades").insert({
        user_id: user.id, ticker: pendingOrder.ticker, side: pendingOrder.side,
        quantity: pendingOrder.quantity, fill_price: fill.fill_price, total_value: fill.total_value, status: "filled",
      });
      await supabase.from("profiles").update({ buying_power: newBP }).eq("id", user.id);

      setFillResult({ fill_price: fill.fill_price });
    } catch {
      setPendingOrder(null); setTradeLoading(false);
      toast({ title: "Error", description: "Order failed. Try again.", variant: "destructive" });
    }
  }, [pendingOrder, user, fillResult, buyingPower, setBuyingPower]);

  const handleTradeCancel = useCallback(() => { setPendingOrder(null); setTradeLoading(false); setFillResult(null); }, []);

  const handleNewMessage = useCallback((userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  const handleUpdateMessage = useCallback((id: string, update: Partial<ChatMessage>) => {
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...update } : m)));
  }, []);

  return (
    <>
      {mode === "voice" ? (
        <VoiceMode
          mode={mode}
          onModeChange={handleModeChange}
          queries={queries}
          onSubmit={handleVoiceSubmit}
          onGenerateThesis={handleGenerateThesis}
          voiceStateOverride={voiceStateOverride}
        />
      ) : (
        <ChatMode mode={mode} onModeChange={handleModeChange} onSubmit={handleChatSubmit} messages={chatMessages} onNewMessage={handleNewMessage} onGenerateThesis={handleGenerateThesis} onUpdateMessage={handleUpdateMessage} />
      )}
      <TradeModal order={pendingOrder} onConfirm={handleTradeConfirm} onCancel={handleTradeCancel} isLoading={tradeLoading} fillResult={fillResult} />
    </>
  );
};

export default AppResearch;
