// app/items/upload/step-3-tag-items/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Item {
  id: string;
  name: string;
  brand: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: string;
  usage_count?: number;
}

interface TaggedItemWithFocus extends Item {
  focusLevel: 1 | 2 | 3;
  focusDescription: string;
}

export default function Step3TagItems() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const itemId = searchParams.get("itemId");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mainItemName, setMainItemName] = useState<string | null>(null);

  // Item tagging with focus levels
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemSearchResults, setItemSearchResults] = useState<Item[]>([]);
  const [searchingItems, setSearchingItems] = useState(false);
  const [taggedItems, setTaggedItems] = useState<TaggedItemWithFocus[]>([]);

  // Outfit tags
  const [outfitTagQuery, setOutfitTagQuery] = useState("");
  const [outfitTagResults, setOutfitTagResults] = useState<Tag[]>([]);
  const [searchingOutfitTags, setSearchingOutfitTags] = useState(false);
  const [selectedOutfitTags, setSelectedOutfitTags] = useState<Tag[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from session storage
  useEffect(() => {
    const storedItemId = sessionStorage.getItem("uploadItemId");
    const storedImageUrl = sessionStorage.getItem("uploadImageUrl");

    if (!storedItemId || !storedImageUrl || storedItemId !== itemId) {
      router.push("/items/upload/step-1-select-item");
      return;
    }

    setImageUrl(storedImageUrl);

    // Fetch main item and auto-add as primary focus
    supabase
      .from("items")
      .select("id, name, brand")
      .eq("id", itemId!)
      .single()
      .then(({ data }) => {
        if (data) {
          setMainItemName(data.name);
          // Auto-add main item as primary focus (level 3)
          setTaggedItems([
            {
              ...data,
              focusLevel: 3,
              focusDescription: "Primary focus",
            },
          ]);
        }
      });
  }, [itemId, router, supabase]);

  // Search for items to tag
  useEffect(() => {
    if (!itemSearchQuery.trim() || itemSearchQuery.length < 2) {
      setItemSearchResults([]);
      return;
    }

    setSearchingItems(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("items")
        .select("id, name, brand")
        .ilike("name", `%${itemSearchQuery}%`)
        .neq("id", itemId!)
        .limit(8);
      setItemSearchResults(data || []);
      setSearchingItems(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [itemSearchQuery, itemId, supabase]);

  // Search for outfit tags
  useEffect(() => {
    if (!outfitTagQuery.trim() || outfitTagQuery.length < 2) {
      setOutfitTagResults([]);
      return;
    }

    setSearchingOutfitTags(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("tags")
        .select("id, name, slug, tag_type")
        .or(`name.ilike.%${outfitTagQuery}%,slug.ilike.%${outfitTagQuery}%`)
        .limit(10);
      setOutfitTagResults(data || []);
      setSearchingOutfitTags(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [outfitTagQuery, supabase]);

  const addItemTag = (item: Item, focusLevel: 1 | 2 | 3 = 2) => {
    if (!taggedItems.find((t) => t.id === item.id)) {
      const focusDescriptions = {
        3: "Primary focus",
        2: "Secondary focus",
        1: "Visible/background",
      };

      setTaggedItems([
        ...taggedItems,
        {
          ...item,
          focusLevel,
          focusDescription: focusDescriptions[focusLevel],
        },
      ]);
    }
    setItemSearchQuery("");
    setItemSearchResults([]);
  };

  const updateItemFocusLevel = (itemId: string, newLevel: 1 | 2 | 3) => {
    setTaggedItems(
      taggedItems.map((item) => {
        if (item.id === itemId) {
          const focusDescriptions = {
            3: "Primary focus",
            2: "Secondary focus",
            1: "Visible/background",
          };
          return {
            ...item,
            focusLevel: newLevel,
            focusDescription: focusDescriptions[newLevel],
          };
        }
        return item;
      }),
    );
  };

  const removeItemTag = (itemIdToRemove: string) => {
    // Don't allow removing the main item
    if (itemIdToRemove === itemId) {
      setError("Cannot remove the main item");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setTaggedItems(taggedItems.filter((t) => t.id !== itemIdToRemove));
  };

  const addOutfitTag = (tag: Tag) => {
    if (!selectedOutfitTags.find((t) => t.id === tag.id)) {
      setSelectedOutfitTags([...selectedOutfitTags, tag]);
    }
    setOutfitTagQuery("");
    setOutfitTagResults([]);
  };

  const removeOutfitTag = (tagIdToRemove: string) => {
    setSelectedOutfitTags(
      selectedOutfitTags.filter((t) => t.id !== tagIdToRemove),
    );
  };

  const handleOutfitTagKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && outfitTagQuery.trim()) {
      e.preventDefault();

      const query = outfitTagQuery.trim().toLowerCase();
      const slug = query.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const existingTag = outfitTagResults.find((t) => t.slug === slug);
      if (existingTag) {
        addOutfitTag(existingTag);
        return;
      }

      const alreadySelected = selectedOutfitTags.find((t) => t.slug === slug);
      if (alreadySelected) {
        setOutfitTagQuery("");
        return;
      }

      const { data: existingDbTag } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .single();

      if (existingDbTag) {
        setSelectedOutfitTags([...selectedOutfitTags, existingDbTag]);
        setOutfitTagQuery("");
        return;
      }

      try {
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({
            name:
              query.charAt(0).toUpperCase() + query.slice(1).replace(/-/g, " "),
            slug: slug,
            tag_type: "vibe",
            is_core: false,
            usage_count: 0,
            description: null,
          })
          .select()
          .single();

        if (createError) {
          setError(`Failed to create tag: ${createError.message}`);
          return;
        }

        if (newTag) {
          setSelectedOutfitTags([...selectedOutfitTags, newTag]);
          setOutfitTagQuery("");
          setError(null);
        }
      } catch (err) {
        setError("Failed to create tag. Please try again.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!itemId || !imageUrl) {
      setError("Missing upload data");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setError("Must be signed in");
        setSubmitting(false);
        return;
      }

      const userId = session.session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("trust_level, clout_points")
        .eq("id", userId)
        .single();

      const trustLevel = profile?.trust_level || 1;
      const autoApprove = trustLevel >= 3;

      // Build item_focus JSONB
      const itemFocus: Record<string, { level: number; description: string }> =
        {};
      taggedItems.forEach((item) => {
        itemFocus[item.id] = {
          level: item.focusLevel,
          description: item.focusDescription,
        };
      });

      // Check for duplicates
      const { data: existingImage } = await supabase
        .from("item_images")
        .select("id")
        .eq("item_id", itemId)
        .eq("image_url", imageUrl)
        .single();

      if (existingImage) {
        sessionStorage.removeItem("uploadItemId");
        sessionStorage.removeItem("uploadImageUrl");
        router.push(`/items/${itemId}`);
        return;
      }

      // Insert image with focus levels
      const { data: imageRecord, error: insertError } = await supabase
        .from("item_images")
        .insert({
          item_id: itemId,
          image_url: imageUrl,
          uploaded_by: userId,
          is_approved: autoApprove,
          needs_approval: !autoApprove,
          upvotes: 0,
          downvotes: 0,
          item_focus: itemFocus,
          tagged_items: taggedItems.map((item) => item.id),
          outfit_tags: selectedOutfitTags.map((tag) => tag.id),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          sessionStorage.removeItem("uploadItemId");
          sessionStorage.removeItem("uploadImageUrl");
          router.push(`/items/${itemId}`);
          return;
        }
        setError(`Failed to save: ${insertError.message}`);
        setSubmitting(false);
        return;
      }

      // Link outfit tags to items via item_tags
      for (const tag of selectedOutfitTags) {
        for (const item of taggedItems) {
          const { data: existingLink } = await supabase
            .from("item_tags")
            .select("id")
            .eq("item_id", item.id)
            .eq("tag_id", tag.id)
            .single();

          if (!existingLink) {
            await supabase.from("item_tags").insert({
              item_id: item.id,
              tag_id: tag.id,
              is_auto_generated: false,
              added_by: userId,
              upvotes: 0,
              downvotes: 0,
              relevance_score: 0,
            });
          }
        }
      }

      // Award clout based on focus levels
      for (const item of taggedItems) {
        const cloutAward =
          item.focusLevel === 3 ? 15 : item.focusLevel === 2 ? 10 : 5;

        const { data: itemData } = await supabase
          .from("items")
          .select("current_clout, peak_clout")
          .eq("id", item.id)
          .single();

        if (itemData) {
          const newClout = (itemData.current_clout || 0) + cloutAward;
          await supabase
            .from("items")
            .update({
              current_clout: newClout,
              peak_clout: Math.max(itemData.peak_clout || 0, newClout),
              last_activity_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }
      }

      // Update tag usage counts
      for (const tag of selectedOutfitTags) {
        const currentCount = tag.usage_count || 0;
        await supabase
          .from("tags")
          .update({ usage_count: currentCount + 1 })
          .eq("id", tag.id);
      }

      // Update user clout
      const tagBonus = selectedOutfitTags.length * 2;
      const totalCloutAwarded = taggedItems.reduce((sum, item) => {
        return (
          sum + (item.focusLevel === 3 ? 15 : item.focusLevel === 2 ? 10 : 5)
        );
      }, 0);

      const newUserClout = (profile?.clout_points || 0) + 25 + tagBonus;
      const newImageCount = 1; // Will be calculated properly later

      await supabase
        .from("profiles")
        .update({
          clout_points: newUserClout,
        })
        .eq("id", userId);

      sessionStorage.removeItem("uploadItemId");
      sessionStorage.removeItem("uploadImageUrl");

      router.push(`/items/${itemId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (!itemId || !imageUrl) {
    return null;
  }

  const getFocusLevelColor = (level: number) => {
    switch (level) {
      case 3:
        return "bg-[#4A7C59] border-[#4A7C59]";
      case 2:
        return "bg-yellow-600 border-yellow-600";
      case 1:
        return "bg-zinc-700 border-zinc-700";
      default:
        return "bg-zinc-800 border-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/items/upload/step-2-upload-photo?itemId=${itemId}`}
            className="text-xs text-zinc-600 hover:text-white transition-colors mb-3 inline-block font-mono"
          >
            ← BACK
          </Link>
          <h1 className="text-2xl font-mono tracking-tight mb-1">
            UPLOAD PHOTO
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Step 3 of 3: Tag items & assign focus levels
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Photo preview */}
        <div className="mb-8">
          <div className="border border-zinc-800 overflow-hidden mb-2 rounded-lg">
            <img
              src={imageUrl}
              alt="upload preview"
              className="w-full"
              style={{
                maxHeight: "300px",
                objectFit: "contain",
                backgroundColor: "#000",
              }}
            />
          </div>
          <div className="text-xs text-zinc-600 font-mono">
            Uploading to: <span className="text-white">{mainItemName}</span>
          </div>
        </div>

        {/* SECTION 1: Tag Items with Focus Levels */}
        <div className="mb-8 pb-8 border-b border-zinc-800">
          <h2 className="text-sm font-mono text-white mb-2 tracking-wider">
            1. WHAT ITEMS ARE VISIBLE?
          </h2>
          <p className="text-xs text-zinc-600 mb-4">
            Tag all clothing/accessories and set their importance level
          </p>

          {/* Focus Level Legend */}
          <div className="mb-4 p-3 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4A7C59] rounded"></div>
                <span>3 = Primary focus (+15 clout)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                <span>2 = Secondary (+10 clout)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-700 rounded"></div>
                <span>1 = Visible (+5 clout)</span>
              </div>
            </div>
          </div>

          <input
            type="text"
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            placeholder="Search items (e.g., black jeans, converse)..."
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-600 outline-none font-mono text-sm rounded"
          />

          {/* Item search results */}
          {searchingItems && (
            <div className="mt-2 text-xs text-zinc-600 font-mono">
              Searching...
            </div>
          )}
          {itemSearchResults.length > 0 && (
            <div className="mt-2 border border-zinc-800 bg-zinc-950 rounded">
              {itemSearchResults.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-zinc-800 last:border-b-0"
                >
                  <div className="px-4 py-3">
                    <div className="font-mono text-sm text-white mb-2">
                      {item.name}
                    </div>
                    {item.brand && (
                      <div className="text-xs text-zinc-500 mb-2">
                        {item.brand}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItemTag(item, 3)}
                        className="flex-1 px-3 py-1.5 bg-[#4A7C59] text-white font-mono text-xs hover:bg-[#3d6649] transition-colors rounded"
                      >
                        Primary (3)
                      </button>
                      <button
                        onClick={() => addItemTag(item, 2)}
                        className="flex-1 px-3 py-1.5 bg-yellow-600 text-white font-mono text-xs hover:bg-yellow-700 transition-colors rounded"
                      >
                        Secondary (2)
                      </button>
                      <button
                        onClick={() => addItemTag(item, 1)}
                        className="flex-1 px-3 py-1.5 bg-zinc-700 text-white font-mono text-xs hover:bg-zinc-600 transition-colors rounded"
                      >
                        Visible (1)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tagged items with focus levels */}
          {taggedItems.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-mono text-zinc-500 mb-2">
                TAGGED ITEMS ({taggedItems.length})
              </div>
              <div className="space-y-2">
                {taggedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      flex items-center justify-between p-3 border-2 rounded
                      ${getFocusLevelColor(item.focusLevel)}
                    `}
                  >
                    <div className="flex-1">
                      <div className="text-white font-mono text-sm">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-white/70 font-mono mt-1">
                        {item.focusDescription}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Focus level buttons */}
                      <div className="flex gap-1">
                        {[3, 2, 1].map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              updateItemFocusLevel(item.id, level as 1 | 2 | 3)
                            }
                            className={`
                              w-8 h-8 font-mono text-xs rounded transition-colors
                              ${
                                item.focusLevel === level
                                  ? "bg-white text-black"
                                  : "bg-black/30 text-white/50 hover:bg-black/50"
                              }
                            `}
                            disabled={item.id === itemId} // Can't change main item
                          >
                            {level}
                          </button>
                        ))}
                      </div>

                      {/* Remove button */}
                      {item.id !== itemId && (
                        <button
                          onClick={() => removeItemTag(item.id)}
                          className="ml-2 text-white/70 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Outfit Tags */}
        <div className="mb-8">
          <h2 className="text-sm font-mono text-white mb-2 tracking-wider">
            2. OUTFIT CONTEXT (OPTIONAL)
          </h2>
          <p className="text-xs text-zinc-600 mb-2">
            Tag the vibe, occasion, or style. These apply to all items in this
            outfit.
          </p>
          <p className="text-xs text-[#4A7C59] mb-4">
            💡 Type and press{" "}
            <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-white text-[10px]">
              Enter
            </kbd>{" "}
            to create new tags
          </p>

          <div className="relative">
            <input
              type="text"
              value={outfitTagQuery}
              onChange={(e) => setOutfitTagQuery(e.target.value)}
              onKeyDown={handleOutfitTagKeyDown}
              placeholder="Type tag name and press Enter (e.g., hike, goth, college)..."
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-700 focus:border-[#4A7C59] outline-none font-mono text-sm rounded"
            />
            {outfitTagQuery.trim() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono pointer-events-none">
                Press Enter ↵
              </div>
            )}
          </div>

          {/* Outfit tag search results */}
          {searchingOutfitTags && (
            <div className="mt-2 text-xs text-zinc-600 font-mono">
              Searching...
            </div>
          )}
          {outfitTagResults.length > 0 && (
            <div className="mt-2 border border-zinc-800 bg-zinc-950 max-h-60 overflow-y-auto rounded">
              {outfitTagResults.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addOutfitTag(tag)}
                  className="block w-full text-left px-4 py-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">
                      #{tag.slug}
                    </span>
                    <span className="text-xs text-zinc-600 uppercase">
                      {tag.tag_type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected outfit tags */}
          {selectedOutfitTags.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-mono text-zinc-500 mb-2">
                OUTFIT TAGS ({selectedOutfitTags.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOutfitTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[#4A7C59] border border-[#3d6649] font-mono text-sm rounded"
                  >
                    <span className="text-white">#{tag.slug}</span>
                    <button
                      onClick={() => removeOutfitTag(tag.id)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-400 text-xs font-mono rounded">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-[#4A7C59] text-white font-mono text-sm hover:bg-[#3d6649] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          {submitting ? "UPLOADING..." : "FINISH UPLOAD"}
        </button>

        {/* Clout breakdown */}
        <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-500 rounded">
          <div className="mb-1">CLOUT BREAKDOWN:</div>
          {taggedItems.map((item) => {
            const clout =
              item.focusLevel === 3 ? 15 : item.focusLevel === 2 ? 10 : 5;
            return (
              <div key={item.id}>
                • {item.name}: +{clout} (level {item.focusLevel})
              </div>
            );
          })}
          {selectedOutfitTags.length > 0 && (
            <div>• Outfit tags: +{selectedOutfitTags.length * 2}</div>
          )}
          <div className="text-white mt-2">
            • You: +{25 + selectedOutfitTags.length * 2} total
          </div>
        </div>
      </div>
    </div>
  );
}
