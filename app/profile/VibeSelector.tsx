"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  tag_type: string | null;
  is_core: boolean;
}

export function VibeSelector({ userId }: { userId: string }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadTags = async () => {
    // Load all core/scene/vibe tags
    const { data: allTags } = await supabase
      .from("tags")
      .select("*")
      .in("tag_type", ["core", "scene", "vibe"])
      .order("is_core", { ascending: false })
      .order("name");

    // Load user's selected tags
    const { data: userTags } = await supabase
      .from("user_vibe_tags")
      .select("tag_id")
      .eq("user_id", userId);

    if (allTags) setTags(allTags);
    if (userTags) {
      setSelectedTags(new Set(userTags.map((t) => t.tag_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTags();
  }, []);

  const toggleTag = async (tagId: string) => {
    const newSelected = new Set(selectedTags);

    if (newSelected.has(tagId)) {
      // Remove
      newSelected.delete(tagId);
      await supabase
        .from("user_vibe_tags")
        .delete()
        .match({ user_id: userId, tag_id: tagId });
    } else {
      // Add
      newSelected.add(tagId);
      await supabase
        .from("user_vibe_tags")
        .insert({ user_id: userId, tag_id: tagId, strength: 5 });
    }

    setSelectedTags(newSelected);
  };

  if (loading) {
    return <div className="text-zinc-500 text-sm">Loading tags...</div>;
  }

  const coreTag = tags.filter((t) => t.is_core);
  const sceneTags = tags.filter((t) => t.tag_type === "scene" && !t.is_core);
  const vibeTags = tags.filter((t) => t.tag_type === "vibe");

  return (
    <div className="space-y-8">
      {/* Cores */}
      {coreTags.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-zinc-600 mb-3">
            Cores
          </h3>
          <div className="flex flex-wrap gap-2">
            {coreTags.map((tag) => (
              <TagButton
                key={tag.id}
                tag={tag}
                isSelected={selectedTags.has(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scenes */}
      {sceneTags.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-zinc-600 mb-3">
            Scenes
          </h3>
          <div className="flex flex-wrap gap-2">
            {sceneTags.map((tag) => (
              <TagButton
                key={tag.id}
                tag={tag}
                isSelected={selectedTags.has(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vibes */}
      {vibeTags.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-zinc-600 mb-3">
            Vibes
          </h3>
          <div className="flex flex-wrap gap-2">
            {vibeTags.map((tag) => (
              <TagButton
                key={tag.id}
                tag={tag}
                isSelected={selectedTags.has(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-6">
        Selected {selectedTags.size} tag{selectedTags.size !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function TagButton({
  tag,
  isSelected,
  onClick,
}: {
  tag: Tag;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm border transition-all
        ${
          isSelected
            ? "border-skaterGreen bg-skaterGreen/10 text-skaterGreen"
            : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
        }
      `}
    >
      <span className="flex items-center gap-2">
        #{tag.name}
        {isSelected && <Check className="w-3 h-3" />}
      </span>
    </button>
  );
}
