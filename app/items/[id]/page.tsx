import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageGallery from "@/components/items/ImageGallery";
import TagDisplay from "@/components/items/TagDisplay";
import RelatedItems from "@/components/items/RelatedItems";
import ItemStats from "@/components/items/ItemStats";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch item with all related data
  const { data: item, error } = await supabase
    .from("items")
    .select(
      `
      *,
      profiles:added_by (
        id,
        username
      ),
      item_images!item_images_item_id_fkey (
        id,
        image_url,
        item_focus,
        tagged_items,
        outfit_tags,
        upvotes,
        downvotes,
        relevance_score,
        is_approved,
        uploaded_by,
        created_at,
        profiles:uploaded_by (
          username
        )
      ),
      item_tags (
        tags (
          id,
          name,
          slug,
          tag_type
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !item) {
    console.error("Item not found:", error);
    notFound();
  }

  // Get tag provenance data for this item
  const { data: tagProvenance } = await supabase
    .from("tag_provenance")
    .select(
      `
      *,
      tags (
        id,
        name,
        slug,
        tag_type
      )
    `,
    )
    .eq("item_id", id);

  // Helper to get numeric focus level for an image and given item id
  const getFocusLevel = (img: any, itemId: string) => {
    try {
      const entry = img.item_focus?.[itemId];
      if (!entry) return 0;
      // entry.level may be number or string
      return typeof entry.level === "number"
        ? entry.level
        : parseInt(entry.level, 10) || 0;
    } catch {
      return 0;
    }
  };

  // Separate images by focus (use item_focus instead of primary_item_id)
  const allImages = (item.item_images || []).filter(
    (img: any) => img.is_approved,
  );

  // Focus images: level >= 3 means primary focus
  const focusImages = allImages.filter(
    (img: any) => getFocusLevel(img, id) >= 3,
  );

  // Also-in images: item appears but not primary (level 1 or 2) OR tagged but not primary
  const alsoInImages = allImages.filter(
    (img: any) =>
      (img.tagged_items?.includes(id) || getFocusLevel(img, id) > 0) &&
      getFocusLevel(img, id) < 3,
  );

  // Sort by relevance score
  const sortByRelevance = (a: any, b: any) => {
    const scoreA = (a.relevance_score || 0) + (a.upvotes || 0);
    const scoreB = (b.relevance_score || 0) + (b.upvotes || 0);
    return scoreB - scoreA;
  };

  const sortedFocusImages = [...focusImages].sort(sortByRelevance);
  const sortedAlsoInImages = [...alsoInImages].sort(sortByRelevance);

  // Primary image (highest relevance from focus images)
  const primaryImage = sortedFocusImages[0] || sortedAlsoInImages[0] || null;

  // Separate manual vs propagated tags
  const manualTags = (item.item_tags || [])
    .map((it: any) => it.tags)
    .filter(Boolean);

  const propagatedTags = (tagProvenance || [])
    .filter((tp: any) => tp.source === "propagated")
    .map((tp: any) => ({
      ...tp.tags,
      confidence: tp.confidence,
      occurrence_count: tp.occurrence_count,
      total_item_appearances: tp.total_item_appearances,
      upvotes: tp.upvotes,
      downvotes: tp.downvotes,
    }));

  // Calculate tier
  const calculateTier = (clout: number): string => {
    if (clout <= 150) return "ATOMIC";
    if (clout <= 600) return "STABLE";
    if (clout <= 1500) return "HYPE";
    return "PEAK";
  };

  const tier = calculateTier(item.current_clout || 0);
  const tierColors: Record<string, string> = {
    ATOMIC: "text-gray-500 border-gray-700",
    STABLE: "text-[#4A7C59] border-[#4A7C59]",
    HYPE: "text-red-500 border-red-500",
    PEAK: "text-red-700 border-red-700",
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/items"
            className="text-xs text-zinc-600 hover:text-white transition-colors font-mono"
          >
            ← BACK TO ITEMS
          </Link>

          <Link
            href={`/items/upload/step-2-upload-photo?itemId=${id}`}
            className="px-4 py-2 bg-[#4A7C59] text-white font-mono text-xs hover:bg-[#3d6649] transition-colors"
          >
            {focusImages.length > 0
              ? "+ UPLOAD PHOTO"
              : "📸 BE FIRST TO UPLOAD"}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Section: Image + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Primary Image */}
          <div>
            {primaryImage ? (
              <div className="aspect-square relative overflow-hidden bg-zinc-950 border-2 border-zinc-800 rounded-xl">
                <img
                  src={primaryImage.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* Image stats overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                    <span>↑ {primaryImage.upvotes || 0}</span>
                    <span>↓ {primaryImage.downvotes || 0}</span>
                    {primaryImage.profiles?.username && (
                      <span className="ml-auto">
                        by @{primaryImage.profiles.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-20">📦</div>
                  <div className="text-zinc-600 font-mono text-sm mb-4">
                    NO IMAGES YET
                  </div>
                  <Link
                    href={`/items/upload/step-2-upload-photo?itemId=${id}`}
                    className="px-6 py-3 bg-[#4A7C59] text-white font-mono text-xs hover:bg-[#3d6649] transition-colors inline-block"
                  >
                    BE FIRST TO UPLOAD
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Item Info */}
          <div>
            {/* Title & Brand */}
            <div className="mb-6">
              <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">
                {item.name}
              </h1>
              {item.brand && (
                <div className="text-xl text-zinc-400 font-mono">
                  {item.brand}
                </div>
              )}
              {item.category && (
                <div className="text-sm text-zinc-600 font-mono mt-1">
                  {item.category}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <ItemStats
              currentClout={item.current_clout || 0}
              peakClout={item.peak_clout || 0}
              tier={tier}
              imageCount={allImages.length}
              viewCount={item.view_count || 0}
              tierColors={tierColors}
            />

            {/* Description */}
            {item.description && (
              <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-sm text-zinc-300 font-mono leading-relaxed">
                  {item.description}
                </div>
              </div>
            )}

            {/* Price Range */}
            {item.min_price_usd && (
              <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-xs text-zinc-600 font-mono mb-1">
                  PRICE RANGE
                </div>
                <div className="text-lg font-mono text-white">
                  ${item.min_price_usd}
                  {item.max_price_usd &&
                  item.max_price_usd !== item.min_price_usd
                    ? ` - $${item.max_price_usd}`
                    : ""}
                </div>
              </div>
            )}

            {/* Layer 1 & 2 Tags */}
            <TagDisplay
              itemId={id}
              manualTags={manualTags}
              propagatedTags={propagatedTags}
              userId={user?.id}
            />

            {/* Buy Link */}
            {item.buy_link && (
              <a
                href={item.buy_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-white text-black font-mono text-sm text-center hover:bg-zinc-200 transition-colors rounded mt-4"
              >
                BUY NOW →
              </a>
            )}

            {/* Added By */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="text-xs text-zinc-600 font-mono">
                Added by{" "}
                <span className="text-white">
                  @{item.profiles?.username || "unknown"}
                </span>
                {" · "}
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery Sections */}
        <ImageGallery
          focusImages={sortedFocusImages}
          alsoInImages={sortedAlsoInImages}
          itemName={item.name}
          userId={user?.id}
        />

        {/* Related Items (Co-occurrence) */}
        <RelatedItems itemId={id} currentItemName={item.name} />

        {/* Comments Section - Placeholder */}
        <div className="mt-12 pt-12 border-t border-zinc-800">
          <h2 className="text-xl font-mono font-bold mb-4">COMMENTS</h2>
          <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
            <div className="text-zinc-600 font-mono text-sm">
              Comments coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
