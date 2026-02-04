import Link from "next/link";

interface ItemCardProps {
  id: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  imageCount: number;
  viewCount: number;
  tags: string[];
  size: "sm" | "md" | "lg";
  isTrendingAgain?: boolean;
}

export default function ItemCard({
  id,
  name,
  brand,
  category,
  imageUrl,
  imageCount,
  viewCount,
  tags,
  size,
  isTrendingAgain = false,
}: ItemCardProps) {
  const heightClass = {
    sm: "h-40",
    md: "h-56",
    lg: "h-72",
  }[size];

  const textSizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-sm",
  }[size];

  return (
    <Link
      href={`/items/${id}`}
      className="block border border-zinc-800 hover:border-zinc-600 transition-colors duration-100 relative overflow-hidden group"
      style={{ borderRadius: 0, backgroundColor: "#0a0a0a" }}
    >
      {/* Image or placeholder */}
      <div
        className={`${heightClass} relative w-full overflow-hidden`}
        style={{ backgroundColor: "#050505" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "item"}
            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-100"
            style={{ filter: "contrast(1.1) brightness(0.85)" }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-800 text-xs tracking-widest uppercase">
              {category || "item"}
            </span>
          </div>
        )}

        {/* Trending Again badge */}
        {isTrendingAgain && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white z-10"
            style={{ backgroundColor: "#d32f2f", borderRadius: 0 }}
          >
            🔥 TRENDING AGAIN
          </div>
        )}

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Stats overlay */}
        <div
          className="absolute bottom-1 right-2 flex gap-2 text-xs text-zinc-500"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
        >
          {imageCount > 0 && <span>{imageCount} img</span>}
          {viewCount > 0 && <span>{viewCount} views</span>}
        </div>
      </div>

      {/* Info strip */}
      <div className="px-2 py-2 border-t border-zinc-800">
        <div className="flex items-baseline gap-2 truncate">
          <span className={`${textSizeClass} font-bold text-white truncate`}>
            {name || "Untitled"}
          </span>
          {brand && (
            <span className="text-xs text-zinc-600 truncate">{brand}</span>
          )}
        </div>

        {/* Tags (max 2 for sm, 3 otherwise) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, size === "sm" ? 2 : 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 border border-zinc-800 text-zinc-500"
                style={{ borderRadius: 0 }}
              >
                #{tag}
              </span>
            ))}
            {tags.length > (size === "sm" ? 2 : 3) && (
              <span className="text-xs text-zinc-700">
                +{tags.length - (size === "sm" ? 2 : 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
