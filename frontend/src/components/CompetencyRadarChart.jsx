import React from "react";

export default function CompetencyRadarChart({ scores = {}, size = 260 }) {
  // Normalize all 6 dimensions to 0 - 5 scale
  const technical = Math.min(5, Math.max(0, (scores.technical ?? 70) / 20)); // 0-100 -> 0-5
  const relevance = Math.min(5, Math.max(0, (scores.relevance ?? 75) / 20)); // 0-100 -> 0-5
  const star = Math.min(5, Math.max(0, scores.star_quality_1_5 ?? ((scores.structure ?? 50) / 20)));
  const fluency = Math.min(5, Math.max(0, scores.fluency ?? 3.5));
  const composure = Math.min(5, Math.max(0, scores.composure ?? (1 - (scores.nervousness ?? 0.2)) * 5));
  const grammar = Math.min(5, Math.max(0, scores.grammar_0_5 ?? 3.5));

  const axes = [
    { label: "Technical", val: technical, max: 5 },
    { label: "Relevance", val: relevance, max: 5 },
    { label: "STAR Structure", val: star, max: 5 },
    { label: "Fluency", val: fluency, max: 5 },
    { label: "Composure", val: composure, max: 5 },
    { label: "Grammar", val: grammar, max: 5 },
  ];

  const center = size / 2;
  const radius = center * 0.70;
  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Compute point for a given axis and radius ratio
  const getCoordinates = (index, ratio) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * ratio;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon background levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Benchmark polygon points (e.g. target 4.2 / 5.0 = 0.84 ratio)
  const targetPoints = axes
    .map((_, i) => {
      const { x, y } = getCoordinates(i, 0.84);
      return `${x},${y}`;
    })
    .join(" ");

  // Candidate polygon points
  const candidateCoords = axes.map((a, i) => {
    const ratio = Math.max(0.1, a.val / a.max);
    return getCoordinates(i, ratio);
  });
  const candidatePoints = candidateCoords.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 10px",
        background: "rgba(13, 21, 39, 0.60)",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: 6, padding: "0 6px" }}>
        <span style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em" }}>
          6-AXIS COMPETENCY RADAR
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#06b6d4" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4", display: "inline-block" }} /> Candidate
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#8b5cf6" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} /> Benchmark
          </span>
        </div>
      </div>

      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Background Grid Concentric Hexagons */}
        {levels.map((lvl, idx) => {
          const pts = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis Spokes from center */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.09)"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
          );
        })}

        {/* Senior Benchmark Polygon */}
        <polygon
          points={targetPoints}
          fill="rgba(139, 92, 246, 0.08)"
          stroke="rgba(139, 92, 246, 0.45)"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />

        {/* Candidate Score Polygon */}
        <polygon
          points={candidatePoints}
          fill="rgba(6, 182, 212, 0.22)"
          stroke="#06b6d4"
          strokeWidth="2"
        />

        {/* Candidate Data Dots */}
        {candidateCoords.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#10b981"
            stroke="#06b6d4"
            strokeWidth="1.5"
          />
        ))}

        {/* Axis Labels */}
        {axes.map((a, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          let textAnchor = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          else if (Math.cos(angle) < -0.3) textAnchor = "end";

          return (
            <text
              key={i}
              x={lx}
              y={ly + 4}
              textAnchor={textAnchor}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="600"
            >
              {a.label}
              <tspan fill="#06b6d4" fontSize="8" dx="3">
                {a.val.toFixed(1)}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}

