"use client";

import { useState } from "react";

const VIBES = [
  "grunge",
  "skater",
  "punk",
  "emo",
  "goth",
  "streetwear",
  "workwear",
  "vintage",
  "minimalist",
  "military",
  "archive",
  "indie",
  "americana",
  "denim",
  "layering",
  "dark",
  "earth tones",
  "monochrome",
  "bold",
  "quiet luxury",
];

export default function VibeSelector() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (vibe: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vibe)) {
        next.delete(vibe);
      } else {
        if (next.size >= 5) return prev;
        next.add(vibe);
      }
      return next;
    });
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {VIBES.map((vibe) => {
          const isSelected = selected.has(vibe);
          return (
            <button
              type="button"
              key={vibe}
              onClick={() => toggle(vibe)}
              className="px-2 py-1 text-xs font-bold tracking-wide uppercase transition-colors duration-100"
              style={{
                borderRadius: 0,
                backgroundColor: isSelected ? "#4A7C59" : "transparent",
                color: isSelected ? "#ffffff" : "#666666",
                border: isSelected ? "1px solid #4A7C59" : "1px solid #333333",
              }}
            >
              {vibe}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-700 mt-2">
        {selected.size > 0
          ? `${selected.size}/5 selected`
          : "Pick up to 5 vibes"}
      </p>
    </div>
  );
}
