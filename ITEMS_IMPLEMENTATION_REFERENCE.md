# ArchiveCult - Items Implementation Reference

## Project Overview

- **Framework**: Next.js 16.1.6 with React 19.2.3 (App Router)
- **Database**: Supabase with server-side SSR client
- **Styling**: Tailwind CSS 3.4.14 (dark theme with red accents)
- **Design**: Underground item-first fashion archive with grunge aesthetic

## Current Items Architecture

### Pages & Structure

```
app/items/
├── page.tsx           (Main items grid - FULLY IMPLEMENTED)
├── [id]/
│   └── page.tsx       (Individual item detail - SCAFFOLD)
└── new/
    └── page.tsx       (Item creation - SCAFFOLD)
```

### Components

```
components/items/
└── ItemCard.tsx       (Item display card - FULLY IMPLEMENTED)

components/ui/
└── ItemsFilter.tsx    (Sort filter buttons - FULLY IMPLEMENTED)
```

---

## Complete Source Code

### 1. `app/items/page.tsx` - Main Items Grid

```tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import ItemCard from "@/components/items/ItemCard";
import ItemsFilter from "@/components/ui/ItemsFilter";
import { calculateItemSize } from "@/lib/utils";

interface RawItem {
  id: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  hotness_score: number;
  image_count: number;
  view_count: number;
  created_at: string;
}

interface ItemWithTags extends RawItem {
  tags: string[];
  bestImageUrl: string | null;
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort || "hot";

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Fetch items
  const query = supabase
    .from("items")
    .select(
      "id, name, brand, category, hotness_score, image_count, view_count, created_at",
    );

  const { data: items } =
    sort === "new"
      ? await query.order("created_at", { ascending: false }).limit(40)
      : await query.order("hotness_score", { ascending: false }).limit(40);

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
        {/* Filter bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
          <ItemsFilter currentSort={sort} />
          <Link
            href="/items/new"
            className="px-3 py-1 text-xs font-bold tracking-widest text-black transition-opacity duration-100 hover:opacity-80"
            style={{ backgroundColor: "#4A7C59", borderRadius: 0 }}
          >
            + NEW
          </Link>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <p className="text-zinc-600 text-xs tracking-widest mb-2">
            NOTHING HERE YET
          </p>
          <p className="text-zinc-700 text-xs text-center mb-4">
            Be the first to add something to the archive
          </p>
          <Link
            href="/items/new"
            className="px-4 py-2 text-xs font-bold tracking-widest text-black"
            style={{ backgroundColor: "#4A7C59", borderRadius: 0 }}
          >
            ADD FIRST ITEM
          </Link>
        </div>
      </div>
    );
  }

  // Gather item IDs for batch tag + image fetches
  const itemIds = items.map((i: RawItem) => i.id);

  // Fetch tags for all items
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("item_id, tag_id")
    .in("item_id", itemIds);

  const tagIds = [
    ...new Set((itemTagRows || []).map((r: { tag_id: string }) => r.tag_id)),
  ];

  let tagNameMap: Record<string, string> = {};
  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);
    (tagRows || []).forEach((t: { id: string; name: string }) => {
      tagNameMap[t.id] = t.name;
    });
  }

  // Build item→tags map
  const itemTagsMap: Record<string, string[]> = {};
  (itemTagRows || []).forEach((r: { item_id: string; tag_id: string }) => {
    if (!itemTagsMap[r.item_id]) itemTagsMap[r.item_id] = [];
    itemTagsMap[r.item_id].push(tagNameMap[r.tag_id] || "");
  });

  // Fetch best (highest upvotes) approved image per item
  const { data: imageRows } = await supabase
    .from("item_images")
    .select("item_id, image_url, upvotes")
    .in("item_id", itemIds)
    .eq("is_approved", true)
    .order("upvotes", { ascending: false });

  const bestImageMap: Record<string, string> = {};
  (imageRows || []).forEach((img: { item_id: string; image_url: string }) => {
    if (!bestImageMap[img.item_id]) {
      bestImageMap[img.item_id] = img.image_url;
    }
  });

  // Enrich items
  const enrichedItems: ItemWithTags[] = (items as RawItem[]).map((item) => ({
    ...item,
    tags: (itemTagsMap[item.id] || []).filter(Boolean),
    bestImageUrl: bestImageMap[item.id] || null,
  }));

  // Determine which items are "trending again" (high hotness but not newest)
  // Simple heuristic: hotness in top 25% but not in first 3 by created_at
  const sortedByNew = [...enrichedItems].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const newestIds = new Set(sortedByNew.slice(0, 3).map((i) => i.id));
  const hotnessThreshold =
    enrichedItems.length > 4
      ? enrichedItems.map((i) => i.hotness_score).sort((a, b) => b - a)[
          Math.floor(enrichedItems.length * 0.25)
        ]
      : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Filter bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <ItemsFilter currentSort={sort} />
        <Link
          href="/items/new"
          className="px-3 py-1 text-xs font-bold tracking-widest text-black transition-opacity duration-100 hover:opacity-80"
          style={{ backgroundColor: "#4A7C59", borderRadius: 0 }}
        >
          + NEW
        </Link>
      </div>

      {/* Clout-weighted grid */}
      <div
        className="p-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
        }}
      >
        {enrichedItems.map((item) => {
          const size = calculateItemSize(item.hotness_score);
          const isTrendingAgain =
            !newestIds.has(item.id) &&
            item.hotness_score >= hotnessThreshold &&
            hotnessThreshold > 0;

          return (
            <div
              key={item.id}
              style={{
                // Large items span both columns
                gridColumn: size === "large" ? "1 / -1" : undefined,
              }}
            >
              <ItemCard
                id={item.id}
                name={item.name}
                brand={item.brand}
                category={item.category}
                imageUrl={item.bestImageUrl}
                imageCount={item.image_count}
                viewCount={item.view_count}
                tags={item.tags}
                size={size}
                isTrendingAgain={isTrendingAgain}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 2. `components/items/ItemCard.tsx` - Item Card Component

```tsx
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
```

---

### 3. `components/ui/ItemsFilter.tsx` - Sort Filter

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ItemsFilterProps {
  currentSort: string;
}

export default function ItemsFilter({ currentSort }: ItemsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/items?${params.toString()}`);
  };

  return (
    <div className="flex border border-zinc-800" style={{ borderRadius: 0 }}>
      <button
        type="button"
        onClick={() => setSort("hot")}
        className={[
          "px-3 py-1 text-xs font-bold tracking-wide uppercase",
          "transition-colors duration-100",
          currentSort === "hot"
            ? "text-white"
            : "text-zinc-600 hover:text-zinc-400",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: currentSort === "hot" ? "#1a1a1a" : "transparent",
          borderRight: "1px solid #1a1a1a",
        }}
      >
        🔥 Hot
      </button>
      <button
        type="button"
        onClick={() => setSort("new")}
        className={[
          "px-3 py-1 text-xs font-bold tracking-wide uppercase",
          "transition-colors duration-100",
          currentSort === "new"
            ? "text-white"
            : "text-zinc-600 hover:text-zinc-400",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: currentSort === "new" ? "#1a1a1a" : "transparent",
        }}
      >
        ◆ New
      </button>
    </div>
  );
}
```

---

### 4. `lib/utils.ts` - Utility Functions (Items-relevant)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function calculateItemSize(clout: number): "small" | "medium" | "large" {
  if (clout >= 1000) return "large";
  if (clout >= 300) return "medium";
  return "small";
}

export function formatClout(clout: number): string {
  if (clout >= 1000) return `${(clout / 1000).toFixed(1)}k`;
  return Math.floor(clout).toString();
}
```

---

### 5. `lib/supabase/types.ts` - TypeScript Types

```typescript
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  clout_points: number;
  trust_level: number;
  created_at: string;
}

export interface Item {
  id: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  current_clout: number;
  created_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  vote_score: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: string | null;
  is_core: boolean;
}
```

---

## Database Schema (Items-Related Tables)

### `items` table

```
id                 UUID PRIMARY KEY
name               TEXT
brand              TEXT
category           TEXT
hotness_score      NUMERIC (calculated)
image_count        INTEGER
view_count         INTEGER
created_at         TIMESTAMP
added_by           UUID (references profiles.id)
```

### `item_images` table

```
id                 UUID PRIMARY KEY
item_id            UUID (references items.id)
image_url          TEXT
upvotes            INTEGER
downvotes          INTEGER
vote_score         INTEGER
is_approved        BOOLEAN
uploaded_by        UUID (references profiles.id)
created_at         TIMESTAMP
```

### `item_tags` table (junction)

```
item_id            UUID (references items.id)
tag_id             UUID (references tags.id)
```

### `tags` table

```
id                 UUID PRIMARY KEY
name               TEXT (unique)
slug               TEXT (unique)
tag_type           TEXT (e.g., 'style', 'brand', 'era')
is_core            BOOLEAN
```

---

## Key Implementation Features

### Grid Layout System

- **Responsive 2-column grid** (grid-template-columns: repeat(2, 1fr))
- **Clout-weighted sizing**: Large items span both columns (hotness_score >= 1000)
- **Gap spacing**: 8px between items
- **Trending badges**: Shows "🔥 TRENDING AGAIN" for high-clout items not in newest 3

### Item Sizing Strategy

- **Small**: hotness_score < 300 (h-40)
- **Medium**: hotness_score 300-999 (h-56)
- **Large**: hotness_score >= 1000 (h-72, spans full width)

### Data Fetching Pattern

1. Fetch items (up to 40) sorted by hotness or created_at
2. Batch fetch all tags for those items
3. Batch fetch best (highest upvotes) approved image per item
4. Map data together for efficient rendering

### Styling Philosophy

- **Dark grunge aesthetic**: #000000 background, #0a0a0a cards
- **Red accents**: #dc2626 for alerts, #4A7C59 for CTAs (green)
- **Square corners**: borderRadius: 0 throughout
- **Scanline effect**: Repeating linear gradient overlay on images
- **Typography**: xs/sm tracking-widest for uppercase labels

---

## Navigation & Links

- Items grid: `/items?sort=hot` (default) or `/items?sort=new`
- Individual item: `/items/{id}`
- Create new item: `/items/new`

---

## Related Reference Patterns

### Server Component Pattern (like items/page.tsx)

```tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data } = await supabase.from("table").select("*");
  // Render with data
}
```

### Client Component Pattern (like ItemsFilter)

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Component() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Interactive logic
}
```

### Auth Protection Pattern (from profile/page.tsx)

```tsx
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
```

---

## Color Palette

- **Black**: #000000 (backgrounds)
- **Near-black**: #0a0a0a, #050505, #1a1a1a (cards, overlays)
- **Red**: #dc2626, #d32f2f (alerts, badges)
- **Green**: #4A7C59 (CTAs)
- **Grays**: zinc-{400,500,600,700,800} (text hierarchy)

---

## Next Steps for Implementation

1. ✅ Items grid page - COMPLETE
2. ✅ ItemCard component - COMPLETE
3. ✅ Filter/sort UI - COMPLETE
4. ⏳ Individual item detail page (`/items/[id]`)
5. ⏳ Item creation/upload page (`/items/new`)
6. ⏳ Image upload handling
7. ⏳ Voting/upvote system for images
8. ⏳ Comment/discussion on items
