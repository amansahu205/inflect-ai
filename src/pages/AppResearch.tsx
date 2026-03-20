import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/app/AppNavbar";
import BottomBar from "@/components/app/BottomBar";
import ModeToggle from "@/components/app/ModeToggle";
import VoiceMode from "@/components/app/VoiceMode";
import ChatMode from "@/components/app/ChatMode";

interface Profile {
  buying_power: number;
  default_mode: string;
}

interface QueryRow {
  id: string;
  transcript: string;
  response_text: string;
}

const AppResearch = () => {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<"voice" | "chat">("voice");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [queries, setQueries] = useState<QueryRow[]>([]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("buying_power, default_mode")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        if (data.default_mode === "chat" || data.default_mode === "voice") {
          setMode(data.default_mode as "voice" | "chat");
        }
      }
    };
    load();
  }, [user]);

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
    [user]
  );

  const handleVoiceSubmit = useCallback(
    async (text: string) => {
      if (!user) return;
      // Placeholder: in real app this would call an AI edge function
      const responseText = `Analysis for "${text}" — this is a placeholder response. Wire up your AI backend to get real results.`;
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
      const responseText = `Analysis for "${text}" — this is a placeholder response. Wire up your AI backend to get real results.`;
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

  const buyingPower = profile?.buying_power ?? 100000;

  return (
    <div className="h-screen flex flex-col" style={{ background: "#080C14" }}>
      <AppNavbar />

      {/* Mode toggle bar */}
      <div className="flex items-center justify-end px-8 py-3 shrink-0">
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Main content */}
      {mode === "voice" ? (
        <VoiceMode queries={queries} onSubmit={handleVoiceSubmit} />
      ) : (
        <ChatMode onSubmit={handleChatSubmit} />
      )}

      <BottomBar portfolioValue={buyingPower} buyingPower={buyingPower} />
    </div>
  );
};

export default AppResearch;
