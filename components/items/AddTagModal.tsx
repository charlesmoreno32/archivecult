// components/items/AddTagModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AddTagModalProps {
  itemId: string;
  onClose: () => void;
}

export default function AddTagModal({ itemId, onClose }: AddTagModalProps) {
  const [tagQuery, setTagQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Search for existing tags
  useEffect(() => {
    if (!tagQuery.trim() || tagQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("tags")
        .select("*")
        .or(`name.ilike.%${tagQuery}%,slug.ilike.%${tagQuery}%`)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [tagQuery, supabase]);

  const handleAddTag = async (tag: any) => {
    setAdding(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Must be signed in");
        setAdding(false);
        return;
      }

      console.log("Current user ID:", user.id); // Debug log

      // Check if tag already exists on this item
      const { data: existing } = await supabase
        .from("item_tags")
        .select("id")
        .eq("item_id", itemId)
        .eq("tag_id", tag.id)
        .single();

      if (existing) {
        setError("Tag already added to this item");
        setAdding(false);
        return;
      }

      // Add tag to item - try with minimal fields first
      const insertData = {
        item_id: itemId,
        tag_id: tag.id,
        is_auto_generated: false,
        added_by: user.id,
      };

      console.log("Attempting insert with:", insertData); // Debug log

      const { data: insertedData, error: insertError } = await supabase
        .from("item_tags")
        .insert(insertData)
        .select();

      if (insertError) {
        console.error("Insert error:", insertError); // Debug log
        setError(`Failed to add tag: ${insertError.message}`);
        setAdding(false);
        return;
      }

      console.log("Insert successful:", insertedData); // Debug log

      // Update tag usage count
      await supabase
        .from("tags")
        .update({ usage_count: (tag.usage_count || 0) + 1 })
        .eq("id", tag.id);

      // Refresh page to show new tag
      window.location.reload();
    } catch (err) {
      console.error("Catch error:", err); // Debug log
      setError("Failed to add tag");
      setAdding(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!tagQuery.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Must be signed in");
        setAdding(false);
        return;
      }

      const slug = tagQuery
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const name =
        tagQuery.trim().charAt(0).toUpperCase() + tagQuery.trim().slice(1);

      // Check if tag exists
      const { data: existingTag } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .single();

      let tagId = existingTag?.id;

      if (!tagId) {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({
            name,
            slug,
            tag_type: "attribute",
            is_core: false,
            usage_count: 0,
          })
          .select()
          .single();

        if (createError || !newTag) {
          setError("Failed to create tag");
          setAdding(false);
          return;
        }

        tagId = newTag.id;
      }

      // Add to item
      await handleAddTag({ id: tagId, name, slug, usage_count: 0 });
    } catch (err) {
      setError("Failed to create tag");
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-mono font-bold">ADD TAG</h3>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagQuery.trim()) {
                handleCreateAndAdd();
              }
            }}
            placeholder="Search or create tag..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-zinc-600 outline-none font-mono text-sm rounded"
            autoFocus
          />
          <div className="text-xs text-zinc-600 font-mono mt-2">
            Press Enter to create if not found
          </div>
        </div>

        {/* Search Results */}
        {searching && (
          <div className="text-xs text-zinc-600 font-mono mb-2">
            Searching...
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mb-4 max-h-60 overflow-y-auto border border-zinc-800 rounded">
            {searchResults.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag)}
                disabled={adding}
                className="w-full text-left px-4 py-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                <div className="font-mono text-sm text-white">#{tag.slug}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {tag.tag_type} · {tag.usage_count || 0} uses
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-400 text-xs font-mono rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs transition-colors"
          >
            CANCEL
          </button>
          {tagQuery.trim() && searchResults.length === 0 && !searching && (
            <button
              onClick={handleCreateAndAdd}
              disabled={adding}
              className="flex-1 px-4 py-2 bg-[#4A7C59] text-white font-mono text-xs hover:bg-[#3d6649] transition-colors disabled:opacity-50"
            >
              {adding ? "ADDING..." : `CREATE "${tagQuery}"`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
