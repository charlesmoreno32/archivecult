import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import VoteButtons from "@/components/ui/VoteButtons";
import CommentForm from "@/components/ui/CommentForm";
import { formatRelativeTime } from "@/lib/utils";

interface ItemRow {
  id: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  price_usd: number | null;
  buy_link: string | null;
  hotness_score: number;
  image_count: number;
  view_count: number;
  added_by: string | null;
  created_at: string;
}

interface ImageRow {
  id: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  uploaded_by: string | null;
  created_at: string;
}

interface CommentRow {
  id: string;
  content: string;
  is_story: boolean;
  upvotes: number;
  user_id: string | null;
  created_at: string;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Fetch item
  const { data: item } = await supabase
    .from("items")
    .select(
      "id, name, brand, category, description, price_usd, buy_link, hotness_score, image_count, view_count, added_by, created_at",
    )
    .eq("id", id)
    .single();

  if (!item) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "#000000" }}
      >
        <p className="text-zinc-600 text-xs tracking-widest mb-2">NOT FOUND</p>
        <Link
          href="/items"
          className="text-xs text-zinc-500 hover:text-white transition-colors duration-100"
        >
          ← back to items
        </Link>
      </div>
    );
  }

  const theItem = item as ItemRow;

  // Increment view count (fire and forget)
  supabase
    .from("items")
    .update({ view_count: theItem.view_count + 1 })
    .eq("id", id);

  // Fetch approved images sorted by vote score
  const { data: images } = await supabase
    .from("item_images")
    .select("id, image_url, upvotes, downvotes, uploaded_by, created_at")
    .eq("item_id", id)
    .eq("is_approved", true)
    .order("upvotes", { ascending: false });

  // Fetch tags
  const { data: itemTagRows } = await supabase
    .from("item_tags")
    .select("tag_id")
    .eq("item_id", id);

  const tagIds = (itemTagRows || []).map((r: { tag_id: string }) => r.tag_id);
  let tags: { id: string; name: string; slug: string }[] = [];
  if (tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("tags")
      .select("id, name, slug")
      .in("id", tagIds);
    tags = tagRows || [];
  }

  // Fetch comments (stories first, then by recency)
  const { data: comments } = await supabase
    .from("item_comments")
    .select("id, content, is_story, upvotes, user_id, created_at")
    .eq("item_id", id)
    .order("is_story", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  // Get username for the item creator
  let creatorUsername: string | null = null;
  if (theItem.added_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", theItem.added_by)
      .single();
    creatorUsername = profile?.username || null;
  }

  // Get current user's votes on images (for initialUserVote)
  const { data: session } = await supabase.auth.getSession();
  let userVotes: Record<string, "up" | "down"> = {};
  if (session?.user && (images || []).length > 0) {
    const imageIds = (images as ImageRow[]).map((img) => img.id);
    const { data: votes } = await supabase
      .from("image_votes")
      .select("image_id, vote_type")
      .eq("user_id", session.user.id)
      .in("image_id", imageIds);
    (votes || []).forEach((v: { image_id: string; vote_type: string }) => {
      userVotes[v.image_id] = v.vote_type as "up" | "down";
    });
  }

  // Get comment authors
  const commentAuthorIds = [
    ...new Set(
      (comments || []).map((c: CommentRow) => c.user_id).filter(Boolean),
    ),
  ];
  let authorMap: Record<string, string> = {};
  if (commentAuthorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", commentAuthorIds);
    (authors || []).forEach((a: { id: string; username: string }) => {
      authorMap[a.id] = a.username;
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Back nav */}
      <div
        className="px-3 py-2 border-b border-zinc-800"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Link
          href="/items"
          className="text-zinc-600 text-xs hover:text-white transition-colors duration-100"
        >
          ← ITEMS
        </Link>
      </div>

      {/* Image gallery */}
      {(images || []).length > 0 ? (
        <div className="space-y-0">
          {(images as ImageRow[]).map((img, idx) => (
            <div key={img.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
              {/* Image */}
              <div
                className="w-full relative"
                style={{ backgroundColor: "#050505" }}
              >
                <img
                  src={img.image_url}
                  alt={`${theItem.name || "item"} photo ${idx + 1}`}
                  className="w-full"
                  style={{ filter: "contrast(1.05) brightness(0.9)" }}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
                {/* Scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)",
                  }}
                />
              </div>

              {/* Vote bar */}
              <div
                className="flex items-center justify-between px-3 py-1.5"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <VoteButtons
                  imageId={img.id}
                  initialUpvotes={img.upvotes}
                  initialDownvotes={img.downvotes}
                  initialUserVote={userVotes[img.id] || null}
                />
                <span className="text-xs text-zinc-700">
                  {formatRelativeTime(img.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: "200px", backgroundColor: "#050505" }}
        >
          <span className="text-zinc-800 text-xs tracking-widest uppercase">
            {theItem.category || "no photos yet"}
          </span>
        </div>
      )}

      {/* Item info */}
      <div className="px-3 py-4 border-t border-zinc-800">
        {/* Name + brand */}
        <div className="flex items-baseline gap-2">
          <h1
            className="text-lg font-bold text-white"
            style={{ letterSpacing: "-0.5px" }}
          >
            {theItem.name || "Untitled"}
          </h1>
          {theItem.brand && (
            <span className="text-xs text-zinc-500">{theItem.brand}</span>
          )}
        </div>

        {/* Category badge */}
        {theItem.category && (
          <span
            className="inline-block mt-1 px-2 py-0.5 text-xs text-zinc-500 border border-zinc-800"
            style={{ borderRadius: 0 }}
          >
            {theItem.category.toUpperCase()}
          </span>
        )}

        {/* Description */}
        {theItem.description && (
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            {theItem.description}
          </p>
        )}

        {/* Price + buy link row */}
        <div className="flex items-center gap-4 mt-3">
          {theItem.price_usd && (
            <span className="text-sm font-bold text-white">
              ${theItem.price_usd.toFixed(2)}
            </span>
          )}
          {theItem.buy_link && (
            <a
              href={theItem.buy_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold tracking-wide transition-colors duration-100 hover:opacity-70"
              style={{ color: "#4A7C59" }}
            >
              BUY →
            </a>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="text-xs px-2 py-0.5 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors duration-100"
                style={{ borderRadius: 0 }}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-700">
            added by {creatorUsername ? `@${creatorUsername}` : "someone"}
          </span>
          <span className="text-xs text-zinc-700">·</span>
          <span className="text-xs text-zinc-700">
            {formatRelativeTime(theItem.created_at)}
          </span>
          <span className="text-xs text-zinc-700">·</span>
          <span className="text-xs text-zinc-700">
            {theItem.view_count + 1} views
          </span>
        </div>

        {/* Upload photo CTA */}
        <Link
          href={`/upload?item=${id}`}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 border border-zinc-800 text-xs text-zinc-500 hover:border-zinc-600 hover:text-white transition-colors duration-100"
          style={{ borderRadius: 0 }}
        >
          📸 ADD PHOTO
        </Link>
      </div>

      {/* Comments section */}
      <div className="border-t border-zinc-800">
        <div className="px-3 py-2" style={{ backgroundColor: "#0a0a0a" }}>
          <span className="text-xs font-bold text-zinc-400 tracking-widest">
            COMMENTS & STORIES
          </span>
        </div>

        {/* Comment form */}
        <div className="px-3 py-3">
          <CommentForm itemId={id} />
        </div>

        {/* Comment list */}
        {(comments || []).length > 0 ? (
          <div className="divide-y" style={{ borderColor: "#1a1a1a" }}>
            {(comments as CommentRow[]).map((comment) => (
              <div
                key={comment.id}
                className="px-3 py-3"
                style={{
                  borderLeft: comment.is_story
                    ? "3px solid #4A7C59"
                    : undefined,
                  backgroundColor: comment.is_story ? "#0a120a" : "transparent",
                }}
              >
                {/* Author + time + story badge */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-300">
                    {comment.user_id
                      ? `@${authorMap[comment.user_id] || "unknown"}`
                      : "anonymous"}
                  </span>
                  {comment.is_story && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5"
                      style={{
                        color: "#4A7C59",
                        border: "1px solid #4A7C59",
                        borderRadius: 0,
                      }}
                    >
                      STORY
                    </span>
                  )}
                  <span className="text-xs text-zinc-700">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {comment.content}
                </p>
                {comment.upvotes > 0 && (
                  <span className="text-xs text-zinc-700 mt-1 inline-block">
                    ▲ {comment.upvotes}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4">
            <p className="text-xs text-zinc-700">
              No comments yet. Be the first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
