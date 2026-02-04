"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CommentFormProps {
  itemId: string;
}

export default function CommentForm({ itemId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isStory, setIsStory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Write something");
      return;
    }
    if (content.trim().length < 3) {
      setError("Too short");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Sign in to comment");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("item_comments")
        .insert({
          item_id: itemId,
          content: content.trim(),
          is_story: isStory,
          user_id: session.user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      // Success — reload to show new comment
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment or tell the story..."
        rows={3}
        className="w-full px-3 py-2 text-xs text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none resize-none transition-colors duration-100"
        style={{ borderRadius: 0, backgroundColor: "#000000" }}
      />

      {/* Story toggle + submit row */}
      <div className="flex items-center justify-between mt-2">
        {/* Story toggle */}
        <button
          type="button"
          onClick={() => setIsStory(!isStory)}
          className="flex items-center gap-1.5 text-xs transition-colors duration-100"
          style={{ color: isStory ? "#4A7C59" : "#555555" }}
        >
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 16,
              height: 16,
              borderRadius: 0,
              border: isStory ? "1px solid #4A7C59" : "1px solid #444",
              backgroundColor: isStory ? "#4A7C59" : "transparent",
            }}
          >
            {isStory && (
              <span className="text-white" style={{ fontSize: 10 }}>
                ✓
              </span>
            )}
          </span>
          <span className="font-bold tracking-wide">STORY</span>
        </button>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1 text-xs font-bold tracking-widest text-black transition-opacity duration-100"
          style={{
            borderRadius: 0,
            backgroundColor: submitting ? "#333" : "#4A7C59",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "POSTING..." : "POST"}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-1" style={{ color: "#d32f2f" }}>
          {error}
        </p>
      )}
    </div>
  );
}
