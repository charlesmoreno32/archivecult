// components/items/ImageGallery.tsx
"use client";

import { useState } from "react";
import ImageVoteButton from "./ImageVoteButton";

interface ImageData {
  id: string;
  image_url: string;
  upvotes: number;
  downvotes: number;
  relevance_score: number;
  profiles?: { username: string };
  created_at: string;
}

interface ImageGalleryProps {
  focusImages: ImageData[];
  alsoInImages: ImageData[];
  itemName: string;
  userId?: string;
}

export default function ImageGallery({
  focusImages,
  alsoInImages,
  itemName,
  userId,
}: ImageGalleryProps) {
  const [activeTab, setActiveTab] = useState<"focus" | "also">("focus");
  const [lightboxImage, setLightboxImage] = useState<ImageData | null>(null);

  const displayImages = activeTab === "focus" ? focusImages : alsoInImages;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-mono font-bold">IMAGES</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("focus")}
            className={`
              px-4 py-2 font-mono text-xs transition-colors
              ${
                activeTab === "focus"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-500 hover:text-white"
              }
            `}
          >
            FOCUS ({focusImages.length})
          </button>
          <button
            onClick={() => setActiveTab("also")}
            className={`
              px-4 py-2 font-mono text-xs transition-colors
              ${
                activeTab === "also"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-500 hover:text-white"
              }
            `}
          >
            ALSO IN ({alsoInImages.length})
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-500">
        {activeTab === "focus" ? (
          <>
            📸 Photos specifically showcasing{" "}
            <span className="text-white">{itemName}</span>
          </>
        ) : (
          <>
            👕 Photos where <span className="text-white">{itemName}</span>{" "}
            appears with other items
          </>
        )}
      </div>

      {displayImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayImages.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer aspect-square"
              onClick={() => setLightboxImage(image)}
            >
              <img
                src={image.image_url}
                alt=""
                className="w-full h-full object-cover bg-zinc-950 border border-zinc-800 rounded-lg hover:border-white transition-colors"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-white">
                    <span>⬆ {image.upvotes}</span>
                    <span>⬇ {image.downvotes}</span>
                    {image.profiles?.username && (
                      <span className="ml-auto">
                        @{image.profiles.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
          <div className="text-zinc-600 font-mono text-sm">
            {activeTab === "focus"
              ? "No focus images yet. Be the first to upload!"
              : "This item hasn't appeared in other outfit photos yet."}
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={lightboxImage.image_url}
                alt=""
                className="w-full rounded-lg"
              />

              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/80 text-white rounded-full hover:bg-black transition-colors"
              >
                ✕
              </button>

              {userId && (
                <div className="absolute bottom-4 left-4 right-4">
                  <ImageVoteButton imageId={lightboxImage.id} userId={userId} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
