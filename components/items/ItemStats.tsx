// components/items/ItemStats.tsx
interface ItemStatsProps {
  currentClout: number;
  peakClout: number;
  tier: string;
  imageCount: number;
  viewCount: number;
  tierColors: Record<string, string>;
}

export default function ItemStats({
  currentClout,
  peakClout,
  tier,
  imageCount,
  viewCount,
  tierColors,
}: ItemStatsProps) {
  return (
    <div className="mb-6 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-lg">
      {/* Tier Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            px-3 py-1 border-2 font-mono text-xs tracking-widest
            ${tierColors[tier]}
          `}
        >
          {tier}
        </div>
        <div className="text-xs text-zinc-600 font-mono">
          {currentClout >= 1500
            ? "Peak performance"
            : currentClout >= 600
              ? "High momentum"
              : currentClout >= 150
                ? "Growing steadily"
                : "Just starting"}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-zinc-600 font-mono mb-1">
            CURRENT CLOUT
          </div>
          <div className="text-2xl font-mono font-bold">
            {Math.round(currentClout).toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-600 font-mono mb-1">IMAGES</div>
          <div className="text-2xl font-mono font-bold">{imageCount}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-600 font-mono mb-1">VIEWS</div>
          <div className="text-2xl font-mono font-bold">
            {viewCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Peak Clout Indicator */}
      {peakClout > currentClout && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-600 font-mono">
            Peak: <span className="text-white">{Math.round(peakClout)}</span>
            {" · "}
            <span className="text-red-500">
              ↓ {Math.round(peakClout - currentClout)} from peak
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
