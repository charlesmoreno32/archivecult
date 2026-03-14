// components/items/ItemCard.tsx
import Link from "next/link";
import Image from "next/image";

interface ItemCardProps {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  imageCount: number;
  viewCount: number;
  tags: Array<{ id: string; name: string; slug: string }>;
  size: "big" | "medium" | "small";
  tier: "ATOMIC" | "STABLE" | "HYPE" | "PEAK";
  currentClout: number;
  decayRate: number;
  isTrendingAgain?: boolean;
  showRank?: boolean;
}

export default function ItemCard({
  id,
  name,
  imageUrl,
  tier,
  currentClout,
  decayRate,
  isTrendingAgain,
}: ItemCardProps) {
  const tierBorderColors = {
    ATOMIC: "border-gray-800",
    STABLE: "border-[#4A7C59]/40",
    HYPE: "border-red-500/40",
    PEAK: "border-red-700/60",
  };

  const tierGlowColors = {
    ATOMIC: "shadow-gray-900/50",
    STABLE: "shadow-[#4A7C59]/20 hover:shadow-[#4A7C59]/40",
    HYPE: "shadow-red-900/30 hover:shadow-red-900/60",
    PEAK: "shadow-red-900/50 hover:shadow-red-900/80",
  };

  const isHighClout = currentClout >= 500;

  return (
    <Link
      href={`/items/${id}`}
      className={`
        block relative group overflow-hidden
        bg-gradient-to-br from-gray-900 via-black to-gray-950
        border-2 ${tierBorderColors[tier]}
        hover:border-white 
        transition-all duration-300
        cursor-pointer h-full
        rounded-xl
        ${tierGlowColors[tier]}
        hover:shadow-2xl
        hover:scale-[1.02]
        transform-gpu
      `}
    >
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Image */}
      {imageUrl ? (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={isHighClout}
          />

          {/* Film grain */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              opacity: 0.15,
            }}
          />

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px)",
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-2 opacity-20">📦</div>
            <span className="text-gray-700 font-mono text-xs">NO IMAGE</span>
          </div>
        </div>
      )}

      {/* Strong gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent rounded-xl" />

      {/* Trending badge - top left */}
      {isTrendingAgain && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white font-mono text-[9px] tracking-widest rounded shadow-lg z-10 animate-pulse">
          🔥 TRENDING
        </div>
      )}

      {/* Bottom-right: minimalist overlay (NO background panel) */}
      <div className="absolute bottom-0 right-0 p-2 text-right z-10">
        {/* Title: always 1 line, smaller, ellipsis */}
        <div
          className="
            font-mono font-bold tracking-tight
            text-[10px] md:text-[11px]
            text-white
            max-w-[22ch]
            overflow-hidden text-ellipsis whitespace-nowrap
            drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]
          "
          title={name}
        >
          {name}
        </div>

        {/* Stats row: tiny, single line */}
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-mono whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          <div
            className={`
              ${
                tier === "PEAK"
                  ? "text-red-700"
                  : tier === "HYPE"
                    ? "text-red-500"
                    : tier === "STABLE"
                      ? "text-[#4A7C59]"
                      : "text-gray-500"
              }
              font-bold
            `}
          >
            {isNaN(currentClout) ? "0" : Math.round(currentClout)}
          </div>
          <div className="text-red-400">
            ↓{isNaN(decayRate) ? "0" : decayRate}%
          </div>
        </div>
      </div>

      {/* Hover ring effect */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/0 group-hover:ring-white/20 transition-all duration-300 pointer-events-none" />

      {/* Extra glow for high clout items */}
      {currentClout >= 1000 && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-red-600/20 pointer-events-none" />
      )}
      {currentClout >= 500 && currentClout < 1000 && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-[#4A7C59]/20 pointer-events-none" />
      )}
    </Link>
  );
}
