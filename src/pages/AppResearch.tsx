import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";
import type { ChatMessage } from "@/components/chat/ChatThread";

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
      if (!user) return;
      const responseText = `Analysis for "${text}" — placeholder. Wire up your FastAPI backend.`;
      const { data } = await supabase
        .from("queries")
        .insert({ user_id: user.id, transcript: text, response_text: responseText, mode: "voice", intent_type: "research" })
        .select("id, transcript, response_text")
        .single();
      if (data) setQueries((prev) => [data as QueryRow, ...prev]);
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
