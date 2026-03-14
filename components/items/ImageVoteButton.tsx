// components/items/ImageVoteButton.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageVoteButtonProps {
  imageId: string;
  userId: string;
}

export default function ImageVoteButton({
  imageId,
  userId,
}: ImageVoteButtonProps) {
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentVote();
  }, [imageId, userId]);

  const loadCurrentVote = async () => {
    const { data } = await supabase
      .from("image_votes")
      .select("vote_type")
      .eq("image_id", imageId)
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
          .from("image_votes")
          .delete()
          .eq("image_id", imageId)
          .eq("user_id", userId);
        setCurrentVote(null);
      } else {
        await supabase.from("image_votes").upsert({
          image_id: imageId,
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
    <div className="flex gap-3 bg-black/80 backdrop-blur-sm p-3 rounded-lg">
      <button
        onClick={() => handleVote("up")}
        disabled={loading}
        className={`
          flex-1 px-6 py-3 font-mono text-sm border-2 transition-colors rounded
          ${
            currentVote === "up"
              ? "bg-[#4A7C59] border-[#4A7C59] text-white"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-white hover:text-white"
          }
        `}
      >
        ⬆ UPVOTE
      </button>
      <button
        onClick={() => handleVote("down")}
        disabled={loading}
        className={`
          flex-1 px-6 py-3 font-mono text-sm border-2 transition-colors rounded
          ${
            currentVote === "down"
              ? "bg-red-600 border-red-600 text-white"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-white hover:text-white"
          }
        `}
      >
        ⬇ DOWNVOTE
      </button>
    </div>
  );
}
