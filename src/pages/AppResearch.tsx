import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSessionStore } from "@/store/sessionStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { supabase } from "@/integrations/supabase/client";
import ModeToggle from "@/components/ui/ModeToggle";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";

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

  // Load profile + portfolio data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("buying_power, default_mode")
        .eq("id", user.id)
        .single();
      if (profile) {
        setBuyingPower(profile.buying_power);
        setTotalValue(profile.buying_power);
        if (profile.default_mode === "chat" || profile.default_mode === "voice") {
          setMode(profile.default_mode as "voice" | "chat");
        }
      }
    };
    load();
  }, [user, setBuyingPower, setTotalValue, setMode]);

  // Load queries
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("queries")
        .select("id, transcript, response_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setQueries(data as QueryRow[]);
    };
    load();
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
      const responseText = `Analysis for "${text}" — placeholder response. Wire up your FastAPI backend for real results.`;
      const { data } = await supabase
        .from("queries")
        .insert({
          user_id: user.id,
          transcript: text,
          response_text: responseText,
          mode: "voice",
          intent_type: "research",
        })
        .select("id, transcript, response_text")
        .single();
      if (data) setQueries((prev) => [data as QueryRow, ...prev]);
    },
    [user]
  );

  const handleChatSubmit = useCallback(
    async (text: string): Promise<string> => {
      if (!user) return "Not authenticated.";
      const responseText = `Analysis for "${text}" — placeholder response. Wire up your FastAPI backend for real results.`;
      await supabase.from("queries").insert({
        user_id: user.id,
        transcript: text,
        response_text: responseText,
        mode: "chat",
        intent_type: "research",
      });
      return responseText;
    },
    [user]
  );

  return (
    <div className="h-full flex flex-col" style={{ height: "calc(100vh - 56px - 48px)" }}>
      {/* Mode toggle bar */}
      <div className="flex items-center justify-end px-8 py-3 shrink-0">
        <ModeToggle activeMode={mode} onChange={handleModeChange} />
      </div>

      {/* Main content */}
      {mode === "voice" ? (
        <VoiceMode queries={queries} onSubmit={handleVoiceSubmit} />
      ) : (
        <ChatMode onSubmit={handleChatSubmit} />
      )}
    </div>
  );
};

export default AppResearch;
