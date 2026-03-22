import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { analyzeQuery, transcribeAudio } from "@/api/query";
import { getChartData } from "@/api/chart";
import { getQuote } from "@/api/market";
import { executeTrade as executeTradeApi } from "@/api/trades";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useInflectToast } from "@/components/ui/InflectToast";
import TradeModal from "@/components/trading/TradeModal";
import ResearchSidebar from "@/components/research/ResearchSidebar";
import AnalysisOutputCard from "@/components/research/AnalysisOutputCard";
import VisualizationCard from "@/components/research/VisualizationCard";
import PortfolioWidget from "@/components/research/PortfolioWidget";
import MarketDataWidget from "@/components/research/MarketDataWidget";
import ResearchPromptBar from "@/components/research/ResearchPromptBar";
import JarvisMetricsRow from "@/components/jarvis/JarvisMetricsRow";
import type { AnswerResult, ThesisResult, TradeOrder, StockQuote, Query } from "@/types/api";
import type { AnalyzeResult } from "@/api/query";
import type { VoiceState } from "@/components/voice/VoiceButton";

const USE_BACKEND = true;

// --- Mock fallbacks ---
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
  ticker, price: 189.5, change_percent: 2.4, volume: 52_300_000, direction: "up", timestamp: new Date().toISOString(),
});

const mockThesis = (ticker: string): ThesisResult => ({
  ticker,
  fundamental: { signal: "BULLISH", reason: "Strong revenue growth of 122% YoY driven by data center demand.", citation: `${ticker} 10-K · Filed Feb 2024` },
  technical: { signal: "BULLISH", reason: "Price above 50-day and 200-day moving averages with strong momentum.", rsi: 62 },
  sentiment: { signal: "POSITIVE", reason: "Overwhelmingly positive analyst coverage and institutional buying.", score: 0.87 },
  verdict: "HOLD",
  confidence: "HIGH",
});

function speakText(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0; u.pitch = 1.0;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

const detectTradeIntent = (text: string) => {
  const lower = text.toLowerCase();
  const buyMatch = /\b(buy|purchase|get)\b/i.test(lower);
  const sellMatch = /\b(sell|dump|exit)\b/i.test(lower);
  if (!buyMatch && !sellMatch) return null;
  const ticker = text.match(/\b([A-Z]{1,5})\b/)?.[1] || null;
  const qtyMatch = text.match(/(\d+)\s*(shares?|stocks?)?/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
  return { side: (buyMatch ? "buy" : "sell") as "buy" | "sell", ticker, quantity };
};

const AppResearch = () => {
  const { user } = useAuthStore();
  const { ticker: sessionTicker, timeframe: sessionTimeframe, setTicker, addAnswer, sessionId } = useSessionStore();
  const { buyingPower, setBuyingPower, setTotalValue } = usePortfolioStore();
  const { showToast } = useInflectToast();

  const [queries, setQueries] = useState<Query[]>([]);
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [fillResult, setFillResult] = useState<{ fill_price: number } | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [answerData, setAnswerData] = useState<AnswerResult | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [metricData, setMetricData] = useState<{ metric: string; value: string; period: string; change?: string; changeDirection?: "up" | "down" } | null>(null);
  const [thesisData, setThesisData] = useState<ThesisResult | null>(null);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const { startRecording, stopRecording, audioBlob, isRecording, audioLevel } = useVoiceRecorder();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("buying_power").eq("id", user.id).single();
      if (data) { setBuyingPower(data.buying_power); setTotalValue(data.buying_power); }
    })();
  }, [user, setBuyingPower, setTotalValue]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("queries").select("*").eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false }).limit(20);
      if (data) setQueries(data as unknown as Query[]);
    })();
  }, [user]);

  useEffect(() => {
    if (!isRecording) return;
    if (audioLevel < 0.02) {
      const timer = setTimeout(() => { stopRecording(); setVoiceState("processing"); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [audioLevel, isRecording, stopRecording]);

  useEffect(() => {
    if (!audioBlob || voiceState !== "processing") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await transcribeAudio(audioBlob);
        if (!cancelled) submitQuery(r.transcript);
      } catch {
        if (!cancelled) showToast("Transcription failed", "error");
      } finally {
        if (!cancelled) setVoiceState("idle");
      }
    })();
    return () => { cancelled = true; };
  }, [audioBlob, voiceState]);

  const handleMicClick = useCallback(async () => {
    if (voiceState === "idle") {
      const granted = await startRecording();
      if (!granted) { showToast("Microphone access denied", "error"); return; }
      setVoiceState("recording");
    } else if (voiceState === "recording") {
      stopRecording();
      setVoiceState("processing");
    }
  }, [voiceState, startRecording, stopRecording, showToast]);

  const runPipeline = useCallback(async (text: string) => {
    const start = performance.now();
    let result: AnalyzeResult;
    try {
      result = USE_BACKEND ? await analyzeQuery(text, { ticker: sessionTicker, timeframe: sessionTimeframe }) : mockAnalyze(text);
    } catch { result = mockAnalyze(text); }

    if (result.ticker) setTicker(result.ticker);

    let quote: StockQuote | null = null;
    let metric: typeof metricData = null;

    if (result.intent_type === "price_check" && result.ticker) {
      try { quote = USE_BACKEND ? await getQuote(result.ticker) : mockQuote(result.ticker); } catch { quote = mockQuote(result.ticker); }
    }

    if (result.metric) {
      metric = { metric: result.metric, value: result.metric.includes("Margin") ? "44.1%" : "$394.3B", period: result.timeframe || "Q4 2023", change: "+0.8% YoY", changeDirection: "up" };
    }

    if (user) {
      const { data } = await supabase.from("queries").insert({ user_id: user.id, session_id: sessionId, transcript: text, intent_type: result.intent_type, response_text: result.answer, ticker: result.ticker, mode: "voice" }).select("*").single();
      if (data) setQueries((prev) => [data as unknown as Query, ...prev]);
    }

    const answerResult: AnswerResult = { answer: result.answer, intent_type: result.intent_type, ticker: result.ticker, confidence: result.confidence_level, source: result.source as AnswerResult["source"], citation: result.citation };
    addAnswer(answerResult);
    setLatencyMs(Math.round(performance.now() - start));
    return { result, quote, metricData: metric };
  }, [user, sessionTicker, sessionTimeframe, setTicker, addAnswer, sessionId]);

  const submitQuery = useCallback(async (text: string) => {
    setThesisData(null); setThesisLoading(false); setChartData(null); setActiveQueryId(null);
    const { result, quote, metricData: md } = await runPipeline(text);

    const ad: AnswerResult = { answer: result.answer, intent_type: result.intent_type, ticker: result.ticker, confidence: result.confidence_level, source: result.source as AnswerResult["source"], citation: result.citation };
    setAnswerData(ad);
    setStockQuote(quote);
    setMetricData(md);
    setSelectedOutput(null);

    if (result.intent_type === "trade") {
      const trade = detectTradeIntent(text);
      if (trade?.ticker && trade?.quantity) {
        const estPrice = quote?.price || 189.5;
        setPendingOrder({ ticker: trade.ticker, side: trade.side, quantity: trade.quantity, order_type: "market", estimated_price: estPrice, estimated_total: estPrice * trade.quantity });
      }
    }

    const ttsText = result.intent_type === "price_check" && quote
      ? `${quote.ticker} is at $${quote.price.toFixed(2)}, ${quote.direction} ${Math.abs(quote.change_percent).toFixed(1)} percent`
      : result.answer.slice(0, 200);
    speakText(ttsText);
  }, [runPipeline]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    submitQuery(text);
  }, [submitQuery]);

  const handleGenerateThesis = useCallback(async () => {
    const ticker = answerData?.ticker;
    if (!ticker) return;
    setThesisLoading(true);
    try {
      if (USE_BACKEND) {
        const { apiCall } = await import("@/api/client");
        const result = await apiCall<ThesisResult>("/api/v1/thesis/generate", { method: "POST", body: JSON.stringify({ ticker }) });
        if (result) setThesisData(result);
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setThesisData(mockThesis(ticker));
      }
    } catch { toast({ title: "Error", description: "Couldn't generate thesis", variant: "destructive" }); }
    finally { setThesisLoading(false); }
  }, [answerData]);

  const handlePlotTrend = useCallback(async () => {
    const ticker = answerData?.ticker;
    if (!ticker) return;
    try {
      const data = await getChartData(ticker, metricData?.metric || null, null);
      if (data) setChartData(data);
    } catch { toast({ title: "Error", description: "Couldn't load chart data", variant: "destructive" }); }
  }, [answerData, metricData]);

  const handleQuerySelect = useCallback((query: Query) => {
    setActiveQueryId(query.id);
    setSelectedOutput(query.response_text || "No response available.");
    setAnswerData(null); setThesisData(null); setChartData(null);
  }, []);

  const handleClearQueries = useCallback(() => {
    setQueries([]);
    useSessionStore.getState().clearSession();
  }, []);

  const handleTradeConfirm = useCallback(async () => {
    if (!pendingOrder || !user) return;
    if (fillResult) { setPendingOrder(null); setFillResult(null); setTradeLoading(false); return; }
    setTradeLoading(true);
    try {
      let fill: { fill_price: number; total_value: number };
      if (USE_BACKEND) { fill = await executeTradeApi({ ticker: pendingOrder.ticker, side: pendingOrder.side, quantity: pendingOrder.quantity, order_type: "market" }); }
      else { await new Promise((r) => setTimeout(r, 1500)); const fp = pendingOrder.estimated_price * (1 + (Math.random() - 0.5) * 0.001); fill = { fill_price: fp, total_value: fp * pendingOrder.quantity }; }
      const newBP = pendingOrder.side === "buy" ? buyingPower - fill.total_value : buyingPower + fill.total_value;
      setBuyingPower(newBP);
      await supabase.from("trades").insert({ user_id: user.id, ticker: pendingOrder.ticker, side: pendingOrder.side, quantity: pendingOrder.quantity, fill_price: fill.fill_price, total_value: fill.total_value, status: "filled" });
      await supabase.from("profiles").update({ buying_power: newBP }).eq("id", user.id);
      setFillResult({ fill_price: fill.fill_price });
    } catch { setPendingOrder(null); setTradeLoading(false); toast({ title: "Error", description: "Order failed.", variant: "destructive" }); }
  }, [pendingOrder, user, fillResult, buyingPower, setBuyingPower]);

  const handleTradeCancel = useCallback(() => { setPendingOrder(null); setTradeLoading(false); setFillResult(null); }, []);

  return (
    <div className="flex h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Volumetric background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{
          position: "absolute", top: "15%", left: "5%", width: "45%", height: "50%",
          background: "radial-gradient(ellipse, rgba(0, 212, 255, 0.04) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%", width: "40%", height: "45%",
          background: "radial-gradient(ellipse, rgba(240, 165, 0, 0.03) 0%, transparent 70%)",
        }} />
      </div>

      {/* Sidebar */}
      <div className="shrink-0 relative z-10" style={{ width: 200 }}>
        <ResearchSidebar
          queries={queries}
          activeQueryId={activeQueryId}
          onSelect={handleQuerySelect}
          onClear={handleClearQueries}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Content grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="grid gap-4 h-full"
            style={{
              gridTemplateColumns: "1fr 340px",
              gridTemplateRows: "1fr auto auto",
              minHeight: "calc(100vh - 200px)",
            }}
          >
            {/* Main analysis output */}
            <div style={{ gridRow: "1 / 3" }}>
              <AnalysisOutputCard
                answerData={answerData}
                stockQuote={stockQuote}
                metricData={metricData}
                thesisData={thesisData}
                thesisLoading={thesisLoading}
                selectedOutput={selectedOutput}
                onChipClick={handleTextSubmit}
                onGenerateThesis={handleGenerateThesis}
                onPlotTrend={handlePlotTrend}
              />
            </div>

            {/* Right column — chart */}
            <div>
              <VisualizationCard
                chartData={chartData}
                chartTitle={metricData?.metric || "Price"}
                chartTicker={answerData?.ticker || sessionTicker || ""}
                onPlotTrend={answerData?.ticker ? handlePlotTrend : undefined}
              />
            </div>

            {/* Right column — portfolio widget */}
            <div>
              <PortfolioWidget />
            </div>

            {/* Bottom left — market data + metrics */}
            <div className="flex gap-4">
              <div className="w-1/2">
                <MarketDataWidget />
              </div>
              <div className="w-1/2">
                <div className="glass-panel glass-edge-purple overflow-hidden h-full">
                  <JarvisMetricsRow
                    queryCount={queries.length}
                    activeTicker={sessionTicker}
                    confidence={answerData?.confidence || null}
                    latencyMs={latencyMs}
                  />
                </div>
              </div>
            </div>

            <div />
          </div>
        </div>

        {/* Prompt bar */}
        <div className="shrink-0 p-4 pt-0">
          <ResearchPromptBar
            onSubmit={handleTextSubmit}
            onMicClick={handleMicClick}
            voiceState={voiceState}
            disabled={false}
          />
        </div>

        {/* Bottom status bar */}
        <div
          className="shrink-0 flex items-center justify-between px-6"
          style={{
            height: 32,
            borderTop: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(6, 10, 18, 0.95)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>
              Portfolio: <span style={{ color: "hsl(var(--foreground))", fontWeight: 600 }}>${(usePortfolioStore.getState().totalValue || 0).toLocaleString()}</span>
            </span>
            <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>
              Other Value: <span style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>${(usePortfolioStore.getState().buyingPower || 0).toLocaleString()}</span>
            </span>
            <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>
              Chat Length:{queries.length}
            </span>
          </div>
          <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 9 }}>
            Portfolio
          </span>
        </div>
      </div>

      <TradeModal order={pendingOrder} onConfirm={handleTradeConfirm} onCancel={handleTradeCancel} isLoading={tradeLoading} fillResult={fillResult} />
    </div>
  );
};

export default AppResearch;
