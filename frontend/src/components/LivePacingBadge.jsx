import React from "react";

export default function LivePacingBadge({ wordCount = 0, elapsedSeconds = 0, isRecording = false }) {
  if (elapsedSeconds < 4 || wordCount < 3) return null;

  const wpm = Math.round((wordCount / elapsedSeconds) * 60);

  let status = "ideal";
  let label = "Optimal Interview Pace";
  let color = "#10b981"; // Emerald
  let icon = "✓";

  if (wpm > 165) {
    status = "fast";
    label = "Speaking Fast — Take a breath";
    color = "#f59e0b"; // Amber
    icon = "⚠";
  } else if (wpm < 100) {
    status = "slow";
    label = "Deliberate Pace — Pick up rhythm";
    color = "#38bdf8"; // Light Sky
    icon = "ℹ";
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        background: `${color}14`,
        border: `1px solid ${color}35`,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color,
        marginTop: 6,
        marginBottom: 8,
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontWeight: 700 }}>{icon}</span>
      <span style={{ fontWeight: 700 }}>{wpm} WPM</span>
      <span style={{ opacity: 0.85, fontSize: 10 }}>· {label}</span>
    </div>
  );
}

