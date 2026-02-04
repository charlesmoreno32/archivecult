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
