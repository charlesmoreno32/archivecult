// components/ItemsGrid.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import ItemCard from "@/components/items/ItemCard";
import ItemsFilter from "@/components/items/ItemsFilter";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

type SortOption = "hot" | "new" | "fading" | "trending";

interface ItemsGridProps {
  items: any[];
  user: User | null;
}

export default function ItemsGrid({ items, user }: ItemsGridProps) {
  const [sort, setSort] = useState<SortOption>("hot");
  const [showTooltip, setShowTooltip] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<any[]>([]);

  // Memoize enrichedItems to prevent recreation on every render
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const clout = item.current_clout || 0;
      const tier = calculateTier(clout);
      const size = calculateItemSize(clout);
      const decayRate = getDecayRate(tier);

      const daysSinceCreation =
        (Date.now() - new Date(item.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      const daysSinceActivity =
        (Date.now() - new Date(item.last_activity_at).getTime()) /
        (1000 * 60 * 60 * 24);
      const isTrendingAgain =
        daysSinceCreation > 365 &&
        daysSinceActivity < 30 &&
        item.image_count >= 5;

      return {
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        current_clout: clout,
        peak_clout: item.peak_clout || 0,
        last_decay_at: item.last_decay_at,
        image_count: item.image_count || 0,
        view_count: item.view_count || 0,
        total_upvotes: item.total_upvotes || 0,
        created_at: item.created_at,
        last_activity_at: item.last_activity_at,
        size,
        tier,
        decayRate,
        imageUrl: item.item_images?.[0]?.image_url || null,
        tags: item.item_tags?.map((it: any) => it.tags).filter(Boolean) || [],
        isTrendingAgain,
      };
    });
  }, [items]);

  // Controlled randomization with filter-based variation
  useEffect(() => {
    if (enrichedItems.length === 0) {
      setShuffledItems([]);
      return;
    }

    // Sort by selected filter
    const sorted = [...enrichedItems].sort((a, b) => {
      switch (sort) {
        case "hot":
          return b.current_clout - a.current_clout;
        case "new":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "fading":
          const aFadeScore = a.peak_clout - a.current_clout;
          const bFadeScore = b.peak_clout - b.current_clout;
          return bFadeScore - aFadeScore;
        case "trending":
          const aRecency = new Date(a.last_activity_at).getTime();
          const bRecency = new Date(b.last_activity_at).getTime();
          return bRecency - aRecency;
        default:
          return b.current_clout - a.current_clout;
      }
    });

    // Controlled shuffle: keep top 20 items but randomize their order
    const topItems = sorted.slice(0, 20);
    const restItems = sorted.slice(20);

    // Create seed that changes daily AND per filter for variety
    const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const filterSeeds = { hot: 100, new: 200, fading: 300, trending: 400 };
    const combinedSeed = daySeed + filterSeeds[sort];

    // Shuffle top 20 - different shuffle for each filter
    const shuffleTopItems = seededShuffle([...topItems], combinedSeed);

    // Shuffle rest with different seed
    const shuffleRestItems = seededShuffle([...restItems], combinedSeed + 50);

    // Additionally, shuffle items with same clout for more variety
    const finalShuffled = shuffleItemsWithSameClout(
      [...shuffleTopItems, ...shuffleRestItems],
      combinedSeed,
    );

    setShuffledItems(finalShuffled);
  }, [enrichedItems, sort]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-mono tracking-tight">
            ITEMS{" "}
            <span className="text-gray-600 text-sm">
              ({enrichedItems.length})
            </span>
          </h1>

          {/* Upload button */}
          {user ? (
            <Link
              href="/items/upload/step-1-select-item"
              className="px-4 py-2 bg-[#4A7C59] text-white font-mono text-sm hover:bg-[#3d6649] transition-colors"
            >
              + UPLOAD
            </Link>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button className="relative px-4 py-2 bg-zinc-900 text-zinc-600 font-mono text-sm border border-zinc-800 cursor-not-allowed overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[2px] bg-red-600 rotate-[-15deg] scale-150" />
                </div>
                <span className="relative z-10">+ UPLOAD</span>
              </button>

              {showTooltip && (
                <>
                  <div className="absolute top-full left-0 right-0 h-2" />
                  <div className="absolute top-full mt-2 right-0 w-48 p-3 bg-zinc-950 border border-red-600 z-50 shadow-lg">
                    <div className="text-xs font-mono text-red-500 mb-1">
                      LOCKED
                    </div>
                    <div className="text-xs text-zinc-400 mb-2">
                      Sign in to unlock upload
                    </div>
                    <Link
                      href="/login"
                      className="block w-full px-3 py-1.5 bg-red-600 text-white text-xs font-mono text-center hover:bg-red-700 transition-colors"
                    >
                      SIGN IN →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filter controls */}
        <ItemsFilter currentSort={sort} onSortChange={setSort} />

        {/* Grid legend */}
        <div className="mt-4 p-3 bg-gray-900 border border-gray-800 font-mono text-xs space-y-1">
          <div className="text-gray-400 mb-2">SIZE = CLOUT (NOT RANK):</div>
          <div className="flex gap-4 flex-wrap">
            <span className="text-red-700">■ HUGE: 1000+ clout</span>
            <span className="text-red-500">■ BIG: 500+ clout</span>
            <span className="text-[#4A7C59]">▪ MEDIUM: 200+ clout</span>
            <span className="text-gray-500">· SMALL: &lt;200 clout</span>
          </div>
          <div className="text-zinc-500 mt-2">
            Grid changes with each filter. Size reflects current relevance.
          </div>
        </div>
      </div>

      {/* Organic Messy Grid */}
      <div className="max-w-7xl mx-auto">
        {shuffledItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-500 font-mono mb-4 text-sm">
              NO ITEMS IN ARCHIVE
            </div>
            {user && (
              <Link
                href="/items/new"
                className="px-6 py-3 bg-[#4A7C59] text-white font-mono hover:bg-[#3d6649] transition-colors inline-block text-sm"
              >
                ADD FIRST ITEM
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 auto-rows-[100px]">
            {shuffledItems.map((item) => {
              const { colSpan, rowSpan } = getItemGridSize(item.current_clout);

              return (
                <div
                  key={item.id}
                  style={{
                    gridColumn: `span ${colSpan} / span ${colSpan}`,
                    gridRow: `span ${rowSpan} / span ${rowSpan}`,
                  }}
                >
                  <ItemCard {...item} showRank={false} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="max-w-7xl mx-auto mt-12 p-4 border-t border-gray-800 font-mono text-xs text-gray-500">
        <div className="flex gap-6 flex-wrap">
          <div>
            HUGE (1000+):{" "}
            {shuffledItems.filter((i) => i.current_clout >= 1000).length}
          </div>
          <div>
            BIG (500+):{" "}
            {
              shuffledItems.filter(
                (i) => i.current_clout >= 500 && i.current_clout < 1000,
              ).length
            }
          </div>
          <div>
            MEDIUM (200+):{" "}
            {
              shuffledItems.filter(
                (i) => i.current_clout >= 200 && i.current_clout < 500,
              ).length
            }
          </div>
          <div>
            SMALL (&lt;200):{" "}
            {shuffledItems.filter((i) => i.current_clout < 200).length}
          </div>
          <div className="ml-auto">
            TRENDING AGAIN:{" "}
            {shuffledItems.filter((i) => i.isTrendingAgain).length}
          </div>
        </div>
      </div>
    </div>
  );
}

// Seeded shuffle function (deterministic randomization)
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed;

  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// NEW: Shuffle items with same clout value for more variety
function shuffleItemsWithSameClout<T extends { current_clout: number }>(
  items: T[],
  seed: number,
): T[] {
  // Group items by clout value
  const cloutGroups = new Map<number, T[]>();

  items.forEach((item) => {
    const clout = Math.floor(item.current_clout); // Round to avoid tiny differences
    if (!cloutGroups.has(clout)) {
      cloutGroups.set(clout, []);
    }
    cloutGroups.get(clout)!.push(item);
  });

  // Shuffle items within each clout group
  const result: T[] = [];
  let currentSeed = seed;

  items.forEach((item) => {
    const clout = Math.floor(item.current_clout);
    const group = cloutGroups.get(clout);

    if (group && group.length > 0) {
      // Get a seeded random item from this group
      const seededRandom = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
      };

      const index = Math.floor(seededRandom() * group.length);
      const selectedItem = group.splice(index, 1)[0];
      result.push(selectedItem);

      // Remove empty groups
      if (group.length === 0) {
        cloutGroups.delete(clout);
      }
    }
  });

  return result;
}

function getItemGridSize(clout: number): { colSpan: number; rowSpan: number } {
  if (clout >= 1000) {
    return { colSpan: 4, rowSpan: 3 };
  } else if (clout >= 500) {
    return { colSpan: 3, rowSpan: 2 };
  } else if (clout >= 200) {
    return { colSpan: 2, rowSpan: 2 };
  } else {
    return { colSpan: 2, rowSpan: 1 };
  }
}

function calculateItemSize(clout: number): "big" | "medium" | "small" {
  if (clout >= 1000) return "big";
  if (clout >= 300) return "medium";
  return "small";
}

function calculateTier(clout: number): "ATOMIC" | "STABLE" | "HYPE" | "PEAK" {
  if (clout <= 150) return "ATOMIC";
  if (clout <= 600) return "STABLE";
  if (clout <= 1500) return "HYPE";
  return "PEAK";
}

function getDecayRate(tier: string): number {
  switch (tier) {
    case "ATOMIC":
      return 0.1;
    case "STABLE":
      return 0.5;
    case "HYPE":
      return 1.5;
    case "PEAK":
      return 3.0;
    default:
      return 0.5;
  }
}
