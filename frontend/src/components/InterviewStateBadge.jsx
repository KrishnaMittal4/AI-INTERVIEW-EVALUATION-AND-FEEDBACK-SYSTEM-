/**
 * InterviewStateBadge.jsx — Phase 1
 * Visible pill that shows the current interview state machine state.
 */
import React from "react";

const G = {
  cyan: "#00d4ff",
  green: "#00ff88",
  amber: "#ffb300",
  red: "#ff4757",
  violet: "#a855f7",
  textMut: "#6b7a99",
  mono: "'JetBrains Mono','Fira Code',monospace",
};

const STATE_CONFIG = {
  idle:               { label: "Ready",                  color: G.textMut, icon: "⬜" },
  introduction:       { label: "Introduction",           color: G.cyan,    icon: "👋" },
  speaking:           { label: "AI is speaking...",      color: G.cyan,    icon: "🔊", pulse: true },
  waiting:            { label: "Listening...",            color: G.green,   icon: "👂" },
  recording:          { label: "Recording...",            color: G.red,     icon: "⏺", pulse: true },
  transcribing:       { label: "Transcribing...",         color: G.amber,   icon: "⚙" },
  evaluating:         { label: "Analyzing your answer...",color: G.violet,  icon: "🔍", pulse: true },
  generating_feedback:{ label: "Preparing feedback...",  color: G.amber,   icon: "💭" },
  speaking_feedback:  { label: "AI feedback...",         color: G.cyan,    icon: "💬", pulse: true },
  generating_next:    { label: "Preparing next question...", color: G.violet, icon: "⟳" },
  paused:             { label: "Paused",                 color: G.amber,   icon: "⏸" },
  completed:          { label: "Interview Complete",     color: G.green,   icon: "✅" },
  error:              { label: "Error",                  color: G.red,     icon: "⚠️" },
};

export default function InterviewStateBadge({ state = "idle", style = {} }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 14px",
        borderRadius: 99,
        border: `1px solid ${cfg.color}40`,
        background: `${cfg.color}10`,
        fontSize: 11,
        fontFamily: G.mono,
        color: cfg.color,
        letterSpacing: "0.06em",
        animation: cfg.pulse ? "pulse 1.4s ease-in-out infinite" : "none",
        transition: "all 0.3s ease",
        ...style,
      }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}
