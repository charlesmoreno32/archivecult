"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface VoteButtonsProps {
  imageId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: "up" | "down" | null;
}

export default function VoteButtons({
  imageId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote = null,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    initialUserVote,
  );
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleVote = useCallback(
    async (voteType: "up" | "down") => {
      if (loading) return;
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user) {
        alert("Sign in to vote");
        setLoading(false);
        return;
      }

      // Optimistic update
      const prevVote = userVote;
      if (prevVote === voteType) {
        // Toggle off
        if (voteType === "up") setUpvotes((v) => v - 1);
        else setDownvotes((v) => v - 1);
        setUserVote(null);
      } else {
        if (prevVote === "up") setUpvotes((v) => v - 1);
        if (prevVote === "down") setDownvotes((v) => v - 1);
        if (voteType === "up") setUpvotes((v) => v + 1);
        else setDownvotes((v) => v + 1);
        setUserVote(voteType);
      }

      try {
        if (prevVote === voteType) {
          await supabase
            .from("image_votes")
            .delete()
            .eq("image_id", imageId)
            .eq("user_id", user.id);
        } else if (prevVote) {
          await supabase
            .from("image_votes")
            .update({ vote_type: voteType })
            .eq("image_id", imageId)
            .eq("user_id", user.id);
        } else {
          await supabase.from("image_votes").insert({
            image_id: imageId,
            user_id: user.id,
            vote_type: voteType,
          });
        }
      } catch (err) {
        console.error("Vote error:", err);
        // Revert
        setUpvotes(initialUpvotes);
        setDownvotes(initialDownvotes);
        setUserVote(initialUserVote);
      }

      setLoading(false);
    },
    [
      loading,
      userVote,
      imageId,
      supabase,
      initialUpvotes,
      initialDownvotes,
      initialUserVote,
    ],
  );

  return (
    <div className="flex items-center gap-1">
      {/* Upvote */}
      <button
        type="button"
        onClick={() => handleVote("up")}
        className={[
          "flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-wide",
          "border transition-colors duration-100 focus:outline-none",
          userVote === "up"
            ? "border-zinc-600 text-white"
            : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: userVote === "up" ? "#4A7C59" : "transparent",
        }}
        aria-label="Upvote"
      >
        ▲ {upvotes}
      </button>

      {/* Downvote */}
      <button
        type="button"
        onClick={() => handleVote("down")}
        className={[
          "flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-wide",
          "border transition-colors duration-100 focus:outline-none",
          userVote === "down"
            ? "border-zinc-600 text-white"
            : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: userVote === "down" ? "#d32f2f" : "transparent",
        }}
        aria-label="Downvote"
      >
        ▼ {downvotes}
      </button>
    </div>
  );
}
