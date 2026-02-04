"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Denim",
  "Layering",
  "Bags",
  "Hardware",
  "Other",
];

// Jewelry, Hats, Shirts, Pants, Jackets, Shoes, Bags, Watches, Sunglasses, Belts, Fragrance

export default function NewItemPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("You must be signed in");
        setSubmitting(false);
        return;
      }

      const { data: item, error: insertError } = await supabase
        .from("items")
        .insert({
          name: name.trim(),
          brand: brand.trim() || null,
          category: category || null,
          description: description.trim() || null,
          price_usd: priceUsd ? parseFloat(priceUsd) : null,
          buy_link: buyLink.trim() || null,
          added_by: session.user.id,
          image_count: 0,
          view_count: 0,
          hotness_score: 0,
        })
        .select("id")
        .single();

      if (insertError || !item) {
        setError(insertError?.message || "Failed to create item");
        setSubmitting(false);
        return;
      }

      router.push(`/items/${item.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Back nav */}
      <div
        className="px-3 py-2 border-b border-zinc-800"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <button
          type="button"
          onClick={() => router.push("/items")}
          className="text-zinc-600 text-xs hover:text-white transition-colors duration-100"
        >
          ← ITEMS
        </button>
      </div>

      {/* Header */}
      <div className="px-3 py-4 border-b border-zinc-800">
        <h1
          className="text-lg font-bold text-white tracking-wide"
          style={{ letterSpacing: "-0.5px" }}
        >
          NEW ITEM
        </h1>
        <p className="text-xs text-zinc-600 mt-1">
          Add something to the archive
        </p>
      </div>

      {/* Form */}
      <div className="px-3 py-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            NAME <span style={{ color: "#d32f2f" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Carhartt WIP Detroit Jacket"
            className="w-full px-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors duration-100"
            style={{ borderRadius: 0, backgroundColor: "#000000" }}
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            BRAND
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Carhartt WIP"
            className="w-full px-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors duration-100"
            style={{ borderRadius: 0, backgroundColor: "#000000" }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            CATEGORY
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm text-white border border-zinc-800 focus:border-zinc-600 outline-none appearance-none cursor-pointer transition-colors duration-100"
              style={{ borderRadius: 0, backgroundColor: "#000000" }}
            >
              <option value="" style={{ backgroundColor: "#111" }}>
                Select category
              </option>
              {CATEGORIES.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  style={{ backgroundColor: "#111" }}
                >
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-zinc-600 text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this? Where did it come from? What makes it interesting?"
            rows={3}
            className="w-full px-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none resize-none transition-colors duration-100"
            style={{ borderRadius: 0, backgroundColor: "#000000" }}
          />
        </div>

        {/* Price + Buy Link */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
              PRICE (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors duration-100"
                style={{ borderRadius: 0, backgroundColor: "#000000" }}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
              BUY LINK
            </label>
            <input
              type="url"
              value={buyLink}
              onChange={(e) => setBuyLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors duration-100"
              style={{ borderRadius: 0, backgroundColor: "#000000" }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs" style={{ color: "#d32f2f" }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 text-xs font-bold tracking-widest uppercase text-black transition-opacity duration-100"
          style={{
            borderRadius: 0,
            backgroundColor: submitting ? "#333" : "#4A7C59",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "CREATING..." : "ADD TO ARCHIVE"}
        </button>

        <p className="text-xs text-zinc-700 text-center">
          You can add photos and tags after creating the item
        </p>
      </div>
    </div>
  );
}
