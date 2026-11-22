/**
 * AnswerCoachPanel.jsx — Phase 4
 * Shows STAR checklist (behavioural) or Technical checklist after evaluation.
 */
import React, { useState } from "react";

const G = {
  bg: "rgba(8,16,28,0.75)",
  border: "rgba(255,255,255,0.08)",
  cyan: "#00d4ff",
  green: "#00ff88",
  amber: "#ffb300",
  red: "#ff4757",
  violet: "#a855f7",
  textPri: "#e8eaf6",
  textMut: "#6b7a99",
  glass: "rgba(10,20,40,0.65)",
  mono: "'JetBrains Mono','Fira Code',monospace",
  head: "'Inter','Segoe UI',sans-serif",
};

function CheckItem({ label, done }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 12px",
        borderRadius: 8,
        background: done ? `${G.green}0a` : `${G.red}0a`,
        border: `1px solid ${done ? G.green : G.red}30`,
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>{done ? "✅" : "❌"}</span>
      <span style={{ fontSize: 12, color: done ? G.green : G.red, fontFamily: G.mono }}>
        {label}
      </span>
    </div>
  );
}

export default function AnswerCoachPanel({ coachData, onRetry, mode = "practice" }) {
  const [expanded, setExpanded] = useState(true);

  if (!coachData || mode !== "practice") return null;

  const { type, checklist = {}, completeness_pct = 0, suggestion = "", retry_tip = "" } = coachData;

  const color = completeness_pct >= 80 ? G.green : completeness_pct >= 50 ? G.amber : G.red;

  return (
    <div
      style={{
        background: G.glass,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${G.border}`,
        borderRadius: 14,
        padding: 16,
        marginTop: 14,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: expanded ? 14 : 0,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>🎯</span>
          <span style={{ fontSize: 12, color: G.cyan, fontFamily: G.mono, letterSpacing: "0.08em" }}>
            ANSWER COACH — {type}
          </span>
          <span
            style={{
              fontSize: 11,
              color,
              border: `1px solid ${color}50`,
              borderRadius: 99,
              padding: "2px 10px",
              fontFamily: G.mono,
            }}
          >
            {completeness_pct}%
          </span>
        </div>
        <span style={{ color: G.textMut, fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <>
          {/* Checklist */}
          <div style={{ marginBottom: 12 }}>
            {Object.entries(checklist).map(([label, done]) => (
              <CheckItem key={label} label={label} done={done} />
            ))}
          </div>

          {/* Suggestion */}
          <div
            style={{
              padding: "10px 14px",
              background: `${G.amber}08`,
              border: `1px solid ${G.amber}30`,
              borderRadius: 8,
              fontSize: 12,
              color: G.textPri,
              lineHeight: 1.65,
              marginBottom: 10,
            }}
          >
            💡 {suggestion}
          </div>

          {/* Retry tip */}
          {retry_tip && (
            <div
              style={{
                fontSize: 11,
                color: G.textMut,
                fontFamily: G.mono,
                marginBottom: 12,
                lineHeight: 1.6,
              }}
            >
              {retry_tip}
            </div>
          )}

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: `1px solid ${G.violet}60`,
                background: `${G.violet}15`,
                color: G.violet,
                fontSize: 12,
                fontFamily: G.mono,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${G.violet}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${G.violet}15`;
              }}
            >
              🔄 Retry This Question
            </button>
          )}
        </>
      )}
    </div>
  );
}
