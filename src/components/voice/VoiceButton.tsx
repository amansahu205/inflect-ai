import { useState, useEffect, useRef, useCallback } from "react";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import WaveformVisualizer from "./WaveformVisualizer";
import { useInflectToast } from "@/components/ui/InflectToast";

export type VoiceState = "idle" | "recording" | "processing" | "playing";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onStateChange: (state: VoiceState) => void;
  disabled?: boolean;
}

const processingLabels = ["Transcribing...", "Analyzing...", "Generating...", "Speaking..."];

const VoiceButton = ({ onTranscript, onStateChange, disabled = false }: VoiceButtonProps) => {
  const [state, setState] = useState<VoiceState>("idle");
  const [labelIndex, setLabelIndex] = useState(0);
  const { startRecording, stopRecording, audioBlob, isRecording, audioLevel } = useVoiceRecorder();
  const { showToast } = useInflectToast();
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Propagate state changes
  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  // Processing label cycling
  useEffect(() => {
    if (state !== "processing") {
      setLabelIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLabelIndex((i) => (i + 1) % processingLabels.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [state]);

  // Silence detection during recording
  useEffect(() => {
    if (!isRecording) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      return;
    }

    if (audioLevel < 0.02) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
          setState("processing");
        }, 2000);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [audioLevel, isRecording, stopRecording]);

  // Handle audio blob after recording stops
  useEffect(() => {
    if (audioBlob && state === "processing") {
      // Placeholder: in real app, send blob to STT API
      // For now, simulate transcript after a delay
      const timer = setTimeout(() => {
        onTranscript("Sample voice transcript — wire up your STT backend");
        setState("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [audioBlob, state, onTranscript]);

  const handleClick = useCallback(async () => {
    if (disabled) return;

    if (state === "idle") {
      const granted = await startRecording();
      if (!granted) {
        showToast("Microphone access denied. Type your question below.", "error");
        return;
      }
      setState("recording");
    } else if (state === "recording") {
      stopRecording();
      setState("processing");
    }
    // processing and playing: do nothing
  }, [state, disabled, startRecording, stopRecording, showToast]);

  const borderColor =
    state === "recording" ? "#E05555" : state === "playing" ? "#00D68F" : "#F0A500";

  const bgStyle =
    state === "recording"
      ? "rgba(224,85,85,0.15)"
      : state === "playing"
      ? "rgba(0,214,143,0.1)"
      : state === "processing"
      ? "rgba(240,165,0,0.1)"
      : "radial-gradient(circle, rgba(240,165,0,0.2) 0%, rgba(240,165,0,0.05) 70%, transparent 100%)";

  const boxShadow =
    state === "recording"
      ? "0 0 20px rgba(224,85,85,0.4)"
      : state === "idle"
      ? undefined
      : "none";

  const labelText =
    state === "recording"
      ? "Listening..."
      : state === "processing"
      ? processingLabels[labelIndex]
      : state === "playing"
      ? "Speaking..."
      : "Click to speak";

  const labelColor =
    state === "recording" ? "#E05555" : state === "playing" ? "#00D68F" : "#8892A4";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        disabled={disabled || state === "processing" || state === "playing"}
        className="flex items-center justify-center"
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: `2px solid ${borderColor}`,
          background: bgStyle,
          boxShadow,
          cursor: disabled || state === "processing" || state === "playing" ? "default" : "pointer",
          animation: state === "idle" ? "goldPulse 2s ease-in-out infinite" : "none",
          transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        }}
      >
        {state === "processing" ? (
          <div
            style={{
              width: 24,
              height: 24,
              border: "2px solid rgba(240,165,0,0.3)",
              borderTopColor: "#F0A500",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      {/* Waveform during recording or playing */}
      {(state === "recording" || state === "playing") && (
        <WaveformVisualizer
          isActive
          color={state === "playing" ? "#00D68F" : "#F0A500"}
        />
      )}

      <p
        style={{
          color: labelColor,
          fontSize: 13,
          transition: "color 0.2s, opacity 0.3s",
          minHeight: 20,
        }}
      >
        {labelText}
      </p>
    </div>
  );
};

export default VoiceButton;
