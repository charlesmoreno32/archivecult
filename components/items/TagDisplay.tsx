// components/items/TagDisplay.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import TagVoteButton from "./TagVoteButton";
import AddTagModal from "./AddTagModal";

interface Tag {
  id: string;
  name: string;
  slug: string;
  tag_type: string;
}

interface PropagatedTag extends Tag {
  confidence: number;
  occurrence_count: number;
  total_item_appearances: number;
  upvotes: number;
  downvotes: number;
}

interface TagDisplayProps {
  itemId: string;
  manualTags: Tag[];
  propagatedTags: PropagatedTag[];
  userId?: string;
}

export default function TagDisplay({
  itemId,
  manualTags,
  propagatedTags,
  userId,
}: TagDisplayProps) {
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* LAYER 1: INTRINSIC TAGS (Manual) */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-zinc-600 tracking-wider">
            LAYER 1: ITEM ATTRIBUTES
          </div>
          {userId && (
            <button
              onClick={() => setShowAddTagModal(true)}
              className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-[10px] font-mono transition-colors"
            >
              + ADD TAG
            </button>
          )}
        </div>
        <div className="text-xs text-zinc-500 mb-3">
          Intrinsic properties: material, style, design
        </div>

        {manualTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {manualTags.map((tag) => (
              <div key={tag.id} className="group relative">
                <Link
                  href={`/tags/${tag.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-colors font-mono text-xs"
                >
                  <span>#{tag.slug}</span>
                </Link>

                {/* Vote counts - shown on hover for manual tags */}
                {userId && (
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-black border border-zinc-700 rounded text-[8px] font-mono">
                      <button className="text-[#4A7C59] hover:text-white">
                        +
                      </button>
                      <button className="text-red-500 hover:text-white">
                        −
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-zinc-600 font-mono">
            No manual tags yet
          </div>
        )}
      </div>

      {/* LAYER 2: EMERGENT TAGS (Propagated) */}
      <div className="p-4 bg-zinc-950 border-2 border-[#4A7C59]/40 rounded-lg">
        <div className="text-xs font-mono text-[#4A7C59] mb-3 tracking-wider">
          LAYER 2: EMERGENT CONTEXT (PROPAGATED)
        </div>
        <div className="text-xs text-zinc-500 mb-3">
          Automatically learned from outfit usage patterns
        </div>

        {propagatedTags.length > 0 ? (
          <div className="space-y-2">
            {propagatedTags.map((tag) => {
              const confidence = Math.round((tag.confidence || 0) * 100);
              const voteTotal = tag.upvotes + tag.downvotes;
              const voteConfidence =
                voteTotal > 0
                  ? Math.round((tag.upvotes / voteTotal) * 100)
                  : 50;

              const netVotes = tag.upvotes - tag.downvotes;
              const isExpanded = expandedTag === tag.id;

              return (
                <div key={tag.id} className="border border-zinc-800 rounded">
                  {/* Tag Header with Inline Votes */}
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                    <button
                      onClick={() => setExpandedTag(isExpanded ? null : tag.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <span className="font-mono text-sm text-white">
                        #{tag.slug}
                      </span>
                      <span
                        className={`
                          text-[10px] font-mono
                          ${
                            confidence >= 80
                              ? "text-[#4A7C59]"
                              : confidence >= 60
                                ? "text-yellow-500"
                                : "text-orange-500"
                          }
                        `}
                      >
                        {confidence}%
                      </span>

                      {/* Vote count badge */}
                      <span
                        className={`
                        text-[9px] font-mono px-1.5 py-0.5 rounded
                        ${
                          netVotes > 0
                            ? "bg-[#4A7C59]/20 text-[#4A7C59]"
                            : netVotes < 0
                              ? "bg-red-500/20 text-red-500"
                              : "bg-zinc-800 text-zinc-500"
                        }
                      `}
                      >
                        {netVotes > 0 ? "+" : ""}
                        {netVotes}
                      </span>
                    </button>

                    {/* Inline vote buttons */}
                    <div className="flex items-center gap-1">
                      {userId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Vote logic will be in TagVoteButton
                            }}
                            className="px-2 py-1 text-[#4A7C59] hover:bg-[#4A7C59]/20 font-mono text-xs transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Vote logic will be in TagVoteButton
                            }}
                            className="px-2 py-1 text-red-500 hover:bg-red-500/20 font-mono text-xs transition-colors"
                          >
                            −
                          </button>
                        </div>
                      )}
                      <button
                        className={`text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 py-3 border-t border-zinc-800 bg-zinc-950/50">
                      <div className="space-y-3">
                        {/* Provenance Info */}
                        <div className="text-xs font-mono text-zinc-500">
                          <div className="mb-2">
                            📊{" "}
                            <span className="text-white">Usage Pattern:</span>
                          </div>
                          <div className="pl-4 space-y-1">
                            <div>
                              Appears in: {tag.occurrence_count} /{" "}
                              {tag.total_item_appearances} outfit photos
                            </div>
                            <div>Confidence: {confidence}% (usage-based)</div>
                            {voteTotal > 0 && (
                              <div>
                                Community: {voteConfidence}% agree ({voteTotal}{" "}
                                votes)
                              </div>
                            )}
                            <div className="mt-2 text-[#4A7C59]">
                              Clout impact: {netVotes > 0 ? "+" : ""}
                              {Math.round(netVotes * 0.5)} to uploader
                            </div>
                          </div>
                        </div>

                        {/* Full Voting Buttons */}
                        {userId && (
                          <TagVoteButton
                            itemId={itemId}
                            tagId={tag.id}
                            userId={userId}
                          />
                        )}

                        {/* Tag Type */}
                        <div className="text-[10px] text-zinc-600 font-mono uppercase">
                          Type: {tag.tag_type}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-zinc-600 font-mono">
            No propagated tags yet. Tags will appear as this item is worn in
            different outfit contexts.
          </div>
        )}

        {/* Explanation */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-500 font-mono leading-relaxed">
            💡 Tags propagate automatically when this item appears in multiple
            outfits with the same context. Vote to validate accuracy.
            <span className="text-[#4A7C59] block mt-1">
              Your votes award/deduct clout from uploaders (0.5× vote value).
            </span>
          </div>
        </div>
      </div>

      {/* Add Tag Modal */}
      {showAddTagModal && (
        <AddTagModal
          itemId={itemId}
          onClose={() => setShowAddTagModal(false)}
        />
      )}
    </div>
  );
}
