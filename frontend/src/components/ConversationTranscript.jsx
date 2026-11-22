/**
 * ConversationTranscript.jsx — Phase 1
 * Scrollable live transcript showing AI interviewer and candidate turns.
 */
import React, { useEffect, useRef } from "react";

const G = {
  bg: "rgba(8,16,28,0.75)",
  border: "rgba(255,255,255,0.08)",
  cyan: "#00d4ff",
  green: "#00ff88",
  amber: "#ffb300",
  textPri: "#e8eaf6",
  textMut: "#6b7a99",
  mono: "'JetBrains Mono','Fira Code',monospace",
};

export default function ConversationTranscript({ entries = [], isVisible = true }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length]);

  if (!isVisible || entries.length === 0) return null;

  return (
    <div
      style={{
        background: G.bg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${G.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        maxHeight: 320,
        overflowY: "auto",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: G.textMut,
          fontFamily: G.mono,
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        CONVERSATION TRANSCRIPT
      </div>

      {entries.map((entry, i) => {
        const isAI = entry.role === "ai";
        return (
          <div
            key={i}
            style={{
              marginBottom: 12,
              paddingLeft: isAI ? 0 : 12,
              borderLeft: isAI ? "none" : `2px solid ${G.green}40`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: isAI ? G.cyan : G.green,
                fontFamily: G.mono,
                marginBottom: 3,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isAI ? "🤖 AI INTERVIEWER" : "👤 YOU"}
              {entry.timestamp && (
                <span style={{ color: G.textMut, fontSize: 9 }}>
                  {entry.timestamp}
                </span>
              )}
              {isAI && entry.type && (
                <span
                  style={{
                    fontSize: 9,
                    color: G.amber,
                    border: `1px solid ${G.amber}40`,
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  {entry.type.toUpperCase()}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                color: G.textPri,
                lineHeight: 1.65,
                fontStyle: isAI ? "normal" : "italic",
              }}
            >
              {entry.text}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
