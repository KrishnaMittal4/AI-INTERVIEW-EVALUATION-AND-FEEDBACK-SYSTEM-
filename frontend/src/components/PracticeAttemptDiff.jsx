import React from "react";

export default function PracticeAttemptDiff({ previousAttempt, currentResult, onRetryAgain }) {
  if (!previousAttempt || !currentResult) return null;

  const prevScore = previousAttempt.result?.scores?.overall ?? previousAttempt.result?.score ?? 3.0;
  const currScore = currentResult?.scores?.overall ?? currentResult?.score ?? 3.0;
  const scoreDelta = (currScore - prevScore).toFixed(1);
  const isImproved = currScore >= prevScore;

  const prevStar = Math.round((previousAttempt.result?.star_coverage ?? 0.5) * 100);
  const currStar = Math.round((currentResult?.star_coverage ?? 0.5) * 100);
  const starDelta = currStar - prevStar;

  const prevFillers = previousAttempt.result?.nlp?.fillers?.total_count ?? 0;
  const currFillers = currentResult?.nlp?.fillers?.total_count ?? 0;
  const fillerDelta = currFillers - prevFillers;

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: isImproved ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
        border: `1px solid ${isImproved ? "rgba(16, 185, 129, 0.28)" : "rgba(245, 158, 11, 0.28)"}`,
        marginBottom: 16,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{isImproved ? "🎉" : "🔄"}</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              color: isImproved ? "#10b981" : "#f59e0b",
              letterSpacing: "0.08em",
            }}
          >
            {isImproved ? "PRACTICE ATTEMPT: SCORE INCREASED!" : "PRACTICE ATTEMPT COMPARED"}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 12,
            background: isImproved ? "rgba(16, 185, 129, 0.20)" : "rgba(245, 158, 11, 0.20)",
            color: isImproved ? "#10b981" : "#f59e0b",
          }}
        >
          {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} PTS
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
        {/* Overall Score */}
        <div style={{ background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>OVERALL SCORE</div>
          <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#f8fafc" }}>
            <span style={{ color: "#94a3b8" }}>{prevScore.toFixed(1)}</span> ➔{" "}
            <span style={{ color: isImproved ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
              {currScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* STAR Coverage */}
        <div style={{ background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>STAR COVERAGE</div>
          <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#f8fafc" }}>
            <span style={{ color: "#94a3b8" }}>{prevStar}%</span> ➔{" "}
            <span style={{ color: starDelta >= 0 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
              {currStar}%
            </span>
          </div>
        </div>

        {/* Filler Words */}
        <div style={{ background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4 }}>FILLER WORDS</div>
          <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#f8fafc" }}>
            <span style={{ color: "#94a3b8" }}>{prevFillers}</span> ➔{" "}
            <span style={{ color: fillerDelta <= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
              {currFillers}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onRetryAgain}
          style={{
            fontSize: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            background: "transparent",
            color: "#06b6d4",
            border: "1px solid rgba(6, 182, 212, 0.35)",
            borderRadius: 6,
            padding: "5px 12px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ↻ Practice Once More
        </button>
      </div>
    </div>
  );
}

