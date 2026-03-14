// app/items/upload/step-1-select-item/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Step1SelectItem() {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      name: string;
      brand: string | null;
      category: string | null;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemBrand, setNewItemBrand] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search items as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("items")
        .select("id, name, brand, category")
        .ilike("name", `%${searchQuery}%`)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, supabase]);

  const handleSelectItem = (itemId: string) => {
    // Go to step 2 with selected item
    router.push(`/items/upload/step-2-upload-photo?itemId=${itemId}`);
  };

  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      setError("Item name required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setError("Must be signed in");
        setCreating(false);
        return;
      }

      // Insert new item with default clout values
      const { data: newItem, error: insertError } = await supabase
        .from("items")
        .insert({
          name: newItemName.trim(),
          brand: newItemBrand.trim() || null,
          category: newItemCategory.trim() || null,
          current_clout: 0,
          peak_clout: 0,
          image_count: 0,
          view_count: 0,
          total_upvotes: 0,
          added_by: session.session.user.id,
        })
        .select()
        .single();

      if (insertError) {
        setError(`Failed to create: ${insertError.message}`);
        setCreating(false);
        return;
      }

      // Award user clout for adding item (+10)
      const { data: profile } = await supabase
        .from("profiles")
        .select("clout_points")
        .eq("id", session.session.user.id)
        .single();

      await supabase
        .from("profiles")
        .update({
          clout_points: (profile?.clout_points || 0) + 10,
        })
        .eq("id", session.session.user.id);

      // Go to step 2 with new item
      router.push(`/items/upload/step-2-upload-photo?itemId=${newItem.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/items"
            className="text-xs text-zinc-600 hover:text-white transition-colors mb-3 inline-block font-mono"
          >
            ← BACK TO ITEMS
          </Link>
          <h1 className="text-2xl font-mono tracking-tight mb-1">
            UPLOAD PHOTO
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Step 1 of 3: Select or create item
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search existing items */}
        <div className="mb-8">
          <label className="block text-xs font-mono text-zinc-400 mb-2 tracking-wider">
            SEARCH EXISTING ITEM
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type item name..."
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-600 outline-none font-mono text-sm"
          />

          {/* Search results */}
          {searching && (
            <div className="mt-2 text-xs text-zinc-600 font-mono">
              Searching...
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-zinc-800 bg-zinc-950 max-h-80 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className="block w-full text-left px-4 py-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors"
                >
                  <div className="font-mono text-sm text-white">
                    {item.name}
                  </div>
                  {item.brand && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {item.brand}
                    </div>
                  )}
                  {item.category && (
                    <div className="text-xs text-zinc-700 mt-0.5">
                      {item.category}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-black text-xs text-zinc-600 font-mono">
              OR
            </span>
          </div>
        </div>

        {/* Create new item */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-3 border-2 border-dashed border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors font-mono text-sm"
          >
            + CREATE NEW ITEM
          </button>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-sm text-white">CREATE NEW ITEM</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-zinc-600 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">
                  NAME <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Nike Dunk Low Panda"
                  className="w-full px-4 py-2 bg-black border border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-600 outline-none font-mono text-sm"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">
                  BRAND
                </label>
                <input
                  type="text"
                  value={newItemBrand}
                  onChange={(e) => setNewItemBrand(e.target.value)}
                  placeholder="e.g., Nike, Carhartt"
                  className="w-full px-4 py-2 bg-black border border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-600 outline-none font-mono text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-2">
                  CATEGORY
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-zinc-800 text-white focus:border-zinc-600 outline-none font-mono text-sm"
                >
                  <option value="">Select category...</option>
                  <option value="Sneakers">Sneakers</option>
                  <option value="Boots">Boots</option>
                  <option value="Shoes">Shoes</option>
                  <option value="T-Shirt">T-Shirt</option>
                  <option value="Hoodie">Hoodie</option>
                  <option value="Jacket">Jacket</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Jeans">Jeans</option>
                  <option value="Pants">Pants</option>
                  <option value="Hat">Hat</option>
                  <option value="Accessory">Accessory</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Bag">Bag</option>
                  <option value="Belt">Belt</option>
                </select>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-mono">{error}</p>
              )}

              <button
                onClick={handleCreateNewItem}
                disabled={creating}
                className="w-full py-3 bg-[#4A7C59] text-white font-mono text-sm hover:bg-[#3d6649] transition-colors disabled:opacity-50"
              >
                {creating ? "CREATING..." : "CREATE & CONTINUE →"}
              </button>

              <p className="text-xs text-zinc-700 font-mono text-center">
                You'll earn +10 clout for adding new items
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
