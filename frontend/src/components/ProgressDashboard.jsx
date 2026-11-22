/**
 * ProgressDashboard.jsx — Phase 5
 * Shows multi-session skill history, recurring weaknesses, and revision plan button.
 */
import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const G = {
  bg: "rgba(8,16,28,0.9)",
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

function SkillBar({ skill, scores }) {
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const pct = Math.min(100, (avg / 5) * 100);
  const color = avg >= 4 ? G.green : avg >= 3 ? G.cyan : avg >= 2 ? G.amber : G.red;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: G.textPri }}>{skill}</span>
        <span style={{ fontSize: 11, color, fontFamily: G.mono }}>
          {avg.toFixed(1)}/5 ({scores.length} sessions)
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 99,
            background: color,
            transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

export default function ProgressDashboard({ authToken }) {
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    fetch(`${API}/user/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load progress data.");
        setLoading(false);
      });
  }, [authToken]);

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const r = await fetch(`${API}/user/revision_plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const d = await r.json();
      setPlan(d);
    } catch {
      setError("Could not generate revision plan.");
    } finally {
      setPlanLoading(false);
    }
  };

  if (!authToken) return null;

  return (
    <div
      style={{
        background: G.glass,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${G.border}`,
        borderRadius: 16,
        padding: 20,
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <div style={{ fontSize: 13, color: G.cyan, fontFamily: G.mono, letterSpacing: "0.1em", marginBottom: 16 }}>
        📊 MULTI-SESSION PROGRESS TRACKER
      </div>

      {loading && (
        <div style={{ color: G.textMut, fontSize: 12, fontFamily: G.mono }}>Loading progress data…</div>
      )}

      {error && (
        <div style={{ color: G.red, fontSize: 12 }}>{error}</div>
      )}

      {data && !loading && (
        <>
          {/* Skill history bars */}
          {Object.keys(data.skill_history || {}).length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: G.textMut, fontFamily: G.mono, marginBottom: 10 }}>
                SKILL PERFORMANCE (avg across sessions)
              </div>
              {Object.entries(data.skill_history).map(([skill, scores]) => (
                <SkillBar key={skill} skill={skill} scores={scores} />
              ))}
            </div>
          ) : (
            <div style={{ color: G.textMut, fontSize: 12, marginBottom: 16 }}>
              Complete more interview sessions to see skill trends here.
            </div>
          )}

          {/* Recurring weaknesses */}
          {(data.recurring_weaknesses || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: G.amber, fontFamily: G.mono, marginBottom: 10 }}>
                ⚠ RECURRING WEAKNESSES
              </div>
              {data.recurring_weaknesses.map((w) => (
                <div
                  key={w.skill}
                  style={{
                    padding: "10px 14px",
                    background: `${G.amber}08`,
                    border: `1px solid ${G.amber}30`,
                    borderRadius: 8,
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: G.textPri }}>{w.skill}</span>
                    <span style={{ fontSize: 10, color: G.textMut, marginLeft: 10 }}>
                      {w.appearances} sessions · trend: {w.trend}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: G.red,
                      fontFamily: G.mono,
                      border: `1px solid ${G.red}40`,
                      borderRadius: 99,
                      padding: "2px 10px",
                    }}
                  >
                    avg {w.avg_score}/5
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths */}
          {(data.strengths || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: G.green, fontFamily: G.mono, marginBottom: 10 }}>
                💪 STRONG AREAS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.strengths.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 11,
                      color: G.green,
                      border: `1px solid ${G.green}40`,
                      borderRadius: 99,
                      padding: "3px 12px",
                      background: `${G.green}10`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate Revision Plan button */}
          <button
            onClick={fetchPlan}
            disabled={planLoading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${G.violet}60`,
              background: `${G.violet}18`,
              color: G.violet,
              fontSize: 12,
              fontFamily: G.mono,
              cursor: planLoading ? "not-allowed" : "pointer",
              opacity: planLoading ? 0.6 : 1,
              transition: "all 0.18s",
            }}
          >
            {planLoading ? "⟳ Generating…" : "📅 Generate 7-Day Revision Plan"}
          </button>

          {/* Revision plan output */}
          {plan && plan.plan && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: G.cyan, fontFamily: G.mono, marginBottom: 12 }}>
                📅 YOUR 7-DAY REVISION PLAN
              </div>
              <div style={{ fontSize: 11, color: G.textMut, marginBottom: 12 }}>
                {plan.summary}
              </div>
              {Object.entries(plan.plan).map(([day, info]) => (
                <div
                  key={day}
                  style={{
                    padding: "12px 14px",
                    background: `${G.cyan}06`,
                    border: `1px solid ${G.border}`,
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, color: G.cyan, fontFamily: G.mono }}>
                      {day}: {info.focus_skill}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: info.priority === "HIGH" ? G.red : info.priority === "MEDIUM" ? G.amber : G.green,
                        fontFamily: G.mono,
                      }}
                    >
                      {info.priority}
                    </span>
                  </div>
                  {(info.study_activities || []).map((act, i) => (
                    <div key={i} style={{ fontSize: 11, color: G.textPri, lineHeight: 1.6, paddingLeft: 12 }}>
                      • {act}
                    </div>
                  ))}
                  {info.practice_questions && (
                    <div
                      style={{
                        fontSize: 10,
                        color: G.textMut,
                        fontFamily: G.mono,
                        marginTop: 4,
                      }}
                    >
                      Practice: {info.practice_questions} questions
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {plan && !plan.plan && (
            <div style={{ color: G.textMut, fontSize: 12, marginTop: 10 }}>
              {plan.message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
