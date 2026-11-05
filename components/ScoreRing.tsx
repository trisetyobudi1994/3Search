interface Props { score: number; size?: number; }

export default function ScoreRing({ score, size = 72 }: Props) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size, filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.28))" }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e4e4e7" strokeWidth="6" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#g1)" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-zinc-900">{score}</span>
      </div>
    </div>
  );
}
