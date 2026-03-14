// app/items/page.tsx
import { createClient } from "@/lib/supabase/server";
import ItemsGrid from "@/components/items/ItemsGrid";

export default async function ItemsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch ALL items once with all needed data
  const { data: items, error } = await supabase
    .from("items")
    .select(
      `
      id,
      name,
      brand,
      category,
      current_clout,
      peak_clout,
      last_decay_at,
      image_count,
      view_count,
      total_upvotes,
      created_at,
      last_activity_at,
      item_images (
        image_url,
        is_approved
      ),
      item_tags (
        tags (
          id,
          name,
          slug
        )
      )
    `,
    )
    .eq("item_images.is_approved", true)
    .limit(1, { foreignTable: "item_images" });

  if (error) {
    console.error("Error fetching items:", error);
    return <div className="p-4 text-red-500">Error loading items</div>;
  }

  // Pass raw data AND user to client component
  return <ItemsGrid items={items || []} user={user} />;
}
