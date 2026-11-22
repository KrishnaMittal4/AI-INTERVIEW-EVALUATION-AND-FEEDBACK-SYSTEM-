/**
 * TTSControls.jsx — Phase 1
 * Voice on/off, mute, speed, replay question/feedback controls.
 */
import React, { useState, useEffect } from "react";
import { tts } from "../services/ttsService";

const G = {
  bg: "rgba(8,16,28,0.75)",
  border: "rgba(255,255,255,0.08)",
  cyan: "#00d4ff",
  amber: "#ffb300",
  red: "#ff4757",
  textPri: "#e8eaf6",
  textMut: "#6b7a99",
  green: "#00ff88",
  mono: "'JetBrains Mono','Fira Code',monospace",
};

export default function TTSControls({ style = {} }) {
  const [ttsState, setTtsState] = useState({
    isSpeaking: false,
    isMuted: tts.isMuted,
    rate: tts.rate,
  });

  useEffect(() => {
    const unsub = tts.subscribe((s) => setTtsState({ ...s }));
    return unsub;
  }, []);

  const btnBase = {
    border: `1px solid ${G.border}`,
    borderRadius: 6,
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: G.mono,
    background: "transparent",
    transition: "all 0.18s",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "8px 12px",
        background: G.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${G.border}`,
        borderRadius: 10,
        ...style,
      }}
    >
      {/* Speaking indicator */}
      {ttsState.isSpeaking && (
        <span
          style={{
            fontSize: 10,
            color: G.cyan,
            fontFamily: G.mono,
            animation: "pulse 1s infinite",
          }}
        >
          🔊 Speaking…
        </span>
      )}

      {/* Mute toggle */}
      <button
        onClick={() => tts.toggleMute()}
        title={ttsState.isMuted ? "Unmute AI voice" : "Mute AI voice"}
        style={{
          ...btnBase,
          color: ttsState.isMuted ? G.red : G.cyan,
          borderColor: ttsState.isMuted ? `${G.red}50` : `${G.cyan}40`,
          background: ttsState.isMuted ? `${G.red}12` : `${G.cyan}10`,
        }}
      >
        {ttsState.isMuted ? "🔇 Muted" : "🔊 Voice ON"}
      </button>

      {/* Stop speaking */}
      {ttsState.isSpeaking && (
        <button
          onClick={() => tts.stop()}
          title="Stop speaking"
          style={{ ...btnBase, color: G.amber, borderColor: `${G.amber}40` }}
        >
          ⏹ Stop
        </button>
      )}

      {/* Replay Question */}
      <button
        onClick={() => tts.replayQuestion()}
        title="Replay question"
        style={{ ...btnBase, color: G.textMut }}
      >
        ↩ Question
      </button>

      {/* Replay Feedback */}
      <button
        onClick={() => tts.replayFeedback()}
        title="Replay feedback"
        style={{ ...btnBase, color: G.textMut }}
      >
        ↩ Feedback
      </button>

      {/* Speed slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 10, color: G.textMut, fontFamily: G.mono }}>
          Speed
        </span>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={ttsState.rate}
          onChange={(e) => tts.setRate(parseFloat(e.target.value))}
          style={{ width: 72, accentColor: G.cyan }}
          title={`Speech rate: ${ttsState.rate}x`}
        />
        <span style={{ fontSize: 10, color: G.cyan, fontFamily: G.mono, minWidth: 28 }}>
          {(ttsState.rate || 0.88).toFixed(1)}×
        </span>
      </div>
    </div>
  );
}
