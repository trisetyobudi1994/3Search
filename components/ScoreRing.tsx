"use client";

import { useId } from "react";

interface Props {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 72 }: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const gradientId = `score-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.28))",
      }}
      aria-label={`Skor sinyal ${score} dari 100`}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e4e4e7"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-zinc-900">{Math.round(score)}</span>
      </div>
    </div>
  );
}
