import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import ItemCard from "@/components/items/ItemCard";
import { calculateItemSize } from "@/lib/utils";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Fetch tag by slug
  const { data: tag } = await supabase
    .from("tags")
    .select("id, name, slug, description, usage_count, tag_type")
    .eq("slug", slug)
    .single();

  if (!tag) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "#000000" }}
      >
        <p className="text-zinc-600 text-xs tracking-widest mb-2">
          TAG NOT FOUND
        </p>
        <Link
          href="/items"
          className="text-xs text-zinc-500 hover:text-white transition-colors duration-100"
        >
          ← back to items
        </Link>
      </div>
    );
  }

  // Fetch item_tags for this tag
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("item_id")
    .eq("tag_id", tag.id);

  const itemIds = (itemTagRows || []).map(
    (r: { item_id: string }) => r.item_id,
  );

  let items: Array<{
    id: string;
    name: string | null;
    brand: string | null;
    category: string | null;
    hotness_score: number;
    image_count: number;
    view_count: number;
  }> = [];

  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("items")
      .select(
        "id, name, brand, category, hotness_score, image_count, view_count",
      )
      .in("id", itemIds)
      .order("hotness_score", { ascending: false })
      .limit(30);
    items = data || [];
  }

  // Fetch best images for these items
  let bestImageMap: Record<string, string> = {};
  if (items.length > 0) {
    const { data: imageRows } = await supabase
      .from("item_images")
      .select("item_id, image_url, upvotes")
      .in(
        "item_id",
        items.map((i) => i.id),
      )
      .eq("is_approved", true)
      .order("upvotes", { ascending: false });

    (imageRows || []).forEach((img: { item_id: string; image_url: string }) => {
      if (!bestImageMap[img.item_id]) bestImageMap[img.item_id] = img.image_url;
    });
  }

  // Fetch tags for each item (for the card chips)
  let itemTagsMap: Record<string, string[]> = {};
  if (items.length > 0) {
    const allItemIds = items.map((i) => i.id);
    const { data: allTagRows } = await supabase
      .from("item_tags")
      .select("item_id, tag_id")
      .in("item_id", allItemIds);

    const allTagIds = [
      ...new Set((allTagRows || []).map((r: { tag_id: string }) => r.tag_id)),
    ];
    if (allTagIds.length > 0) {
      const { data: tagNames } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", allTagIds);
      const tagNameMap: Record<string, string> = {};
      (tagNames || []).forEach((t: { id: string; name: string }) => {
        tagNameMap[t.id] = t.name;
      });
      (allTagRows || []).forEach((r: { item_id: string; tag_id: string }) => {
        if (!itemTagsMap[r.item_id]) itemTagsMap[r.item_id] = [];
        if (tagNameMap[r.tag_id])
          itemTagsMap[r.item_id].push(tagNameMap[r.tag_id]);
      });
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Back nav */}
      <div
        className="px-3 py-2 border-b border-zinc-800"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Link
          href="/items"
          className="text-zinc-600 text-xs hover:text-white transition-colors duration-100"
        >
          ← ITEMS
        </Link>
      </div>

      {/* Tag header */}
      <div className="px-3 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-1 border"
            style={{
              color: "#4A7C59",
              borderColor: "#4A7C59",
              borderRadius: 0,
            }}
          >
            #{tag.name}
          </span>
          {tag.tag_type && (
            <span className="text-xs text-zinc-700 uppercase tracking-wide">
              {tag.tag_type}
            </span>
          )}
        </div>
        {tag.description && (
          <p className="text-xs text-zinc-500 mt-2">{tag.description}</p>
        )}
        <p className="text-xs text-zinc-700 mt-1">
          {tag.usage_count || items.length} items
        </p>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <p className="text-zinc-700 text-xs text-center">
            No items with this tag yet
          </p>
        </div>
      ) : (
        <div
          className="p-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "8px",
          }}
        >
          {items.map((item) => {
            const size = calculateItemSize(item.hotness_score);
            return (
              <div
                key={item.id}
                style={{ gridColumn: size === "lg" ? "1 / -1" : undefined }}
              >
                <ItemCard
                  id={item.id}
                  name={item.name}
                  brand={item.brand}
                  category={item.category}
                  imageUrl={bestImageMap[item.id] || null}
                  imageCount={item.image_count}
                  viewCount={item.view_count}
                  tags={itemTagsMap[item.id] || []}
                  size={size}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
