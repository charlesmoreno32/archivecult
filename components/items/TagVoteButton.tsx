// components/items/TagVoteButton.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TagVoteButtonProps {
  itemId: string;
  tagId: string;
  userId: string;
}

export default function TagVoteButton({
  itemId,
  tagId,
  userId,
}: TagVoteButtonProps) {
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentVote();
  }, [itemId, tagId, userId]);

  const loadCurrentVote = async () => {
    const { data } = await supabase
      .from("tag_votes")
      .select("vote_type")
      .eq("item_id", itemId)
      .eq("tag_id", tagId)
      .eq("user_id", userId)
      .single();

    if (data) {
      setCurrentVote(data.vote_type as "up" | "down");
    }
  };

  const handleVote = async (voteType: "up" | "down") => {
    if (loading) return;
    setLoading(true);

    try {
      if (currentVote === voteType) {
        await supabase
          .from("tag_votes")
          .delete()
          .eq("item_id", itemId)
          .eq("tag_id", tagId)
          .eq("user_id", userId);
        setCurrentVote(null);
      } else {
        await supabase.from("tag_votes").upsert({
          item_id: itemId,
          tag_id: tagId,
          user_id: userId,
          vote_type: voteType,
        });
        setCurrentVote(voteType);
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleVote("up")}
        disabled={loading}
        className={`
          flex-1 px-4 py-2 font-mono text-xs border transition-colors
          ${
            currentVote === "up"
              ? "bg-[#4A7C59] border-[#4A7C59] text-white"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          }
        `}
      >
        ⬆ AGREE
      </button>
      <button
        onClick={() => handleVote("down")}
        disabled={loading}
        className={`
          flex-1 px-4 py-2 font-mono text-xs border transition-colors
          ${
            currentVote === "down"
              ? "bg-red-600 border-red-600 text-white"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          }
        `}
      >
        ⬇ DISAGREE
      </button>
    </div>
  );
}
