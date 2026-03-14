// components/items/RelatedItems.tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

interface RelatedItemsProps {
  itemId: string;
  currentItemName: string;
}

export default async function RelatedItems({
  itemId,
  currentItemName,
}: RelatedItemsProps) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: coOccurrences } = await supabase
    .from("item_images")
    .select("tagged_items")
    .contains("tagged_items", [itemId])
    .limit(100);

  const itemCounts = new Map<string, number>();

  coOccurrences?.forEach((img: any) => {
    img.tagged_items?.forEach((taggedItemId: string) => {
      if (taggedItemId !== itemId) {
        itemCounts.set(taggedItemId, (itemCounts.get(taggedItemId) || 0) + 1);
      }
    });
  });

  const topItemIds = Array.from(itemCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  if (topItemIds.length === 0) {
    return null;
  }

  const { data: relatedItems } = await supabase
    .from("items")
    .select(
      `
      id,
      name,
      brand,
      current_clout,
      item_images!item_images_item_id_fkey (
        image_url
      )
    `,
    )
    .in("id", topItemIds)
    .limit(6);

  if (!relatedItems || relatedItems.length === 0) {
    return null;
  }

  const itemsWithCounts = relatedItems.map((item: any) => ({
    ...item,
    occurrences: itemCounts.get(item.id) || 0,
  }));

  return (
    <div className="mt-12 pt-12 border-t border-zinc-800">
      <h2 className="text-2xl font-mono font-bold mb-4">
        FREQUENTLY WORN WITH
      </h2>
      <div className="text-xs text-zinc-500 font-mono mb-6">
        Items that often appear together with {currentItemName} in outfit photos
        (co-occurrence data for RQ4)
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {itemsWithCounts.map((item: any) => (
          <Link key={item.id} href={`/items/${item.id}`} className="group">
            <div className="aspect-square bg-zinc-950 border border-zinc-800 hover:border-white transition-colors overflow-hidden rounded-lg mb-2">
              {item.item_images?.[0]?.image_url ? (
                <img
                  src={item.item_images[0].image_url}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                  📦
                </div>
              )}
            </div>
            <div className="font-mono text-xs">
              <div className="text-white line-clamp-2 mb-1">{item.name}</div>
              {item.brand && (
                <div className="text-zinc-600 text-[10px]">{item.brand}</div>
              )}
              <div className="text-[#4A7C59] text-[10px] mt-1">
                {item.occurrences}× together
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
