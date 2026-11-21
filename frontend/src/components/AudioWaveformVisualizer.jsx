import React, { useEffect, useRef } from "react";

export default function AudioWaveformVisualizer({ stream, isRecording, color = "#06b6d4", height = 48 }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    audioCtxRef.current = audioCtx;

    let sourceNode;
    try {
      sourceNode = audioCtx.createMediaStreamSource(stream);
    } catch {
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    sourceNode.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, width, ch);

      const barCount = 28;
      const barWidth = Math.floor(width / (barCount * 1.5));
      const spacing = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[binIndex] || 0;
        const percent = val / 255;
        const barHeight = Math.max(4, percent * ch * 0.88);

        const x = i * (barWidth + spacing);
        const y = (ch - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, "#06b6d4");
        grad.addColorStop(0.5, "#10b981");
        grad.addColorStop(1, "#8b5cf6");

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isRecording, stream]);

  return (
    <div
      style={{
        display: isRecording ? "flex" : "none",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "10px 14px",
        borderRadius: 8,
        background: "rgba(6, 182, 212, 0.06)",
        border: "1px solid rgba(6, 182, 212, 0.25)",
        marginBottom: 12,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            boxShadow: "0 0 10px #ef4444",
            animation: "pulse 1s infinite",
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            color: "#06b6d4",
            letterSpacing: "0.1em",
          }}
        >
          LIVE AUDIO FREQUENCY SPECTRUM
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={height}
        style={{ width: "100%", maxWidth: 360, height }}
      />
    </div>
  );
}

