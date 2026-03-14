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

export default function NewItemPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
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
          min_price_usd: minPrice ? parseFloat(minPrice) : null,
          max_price_usd: maxPrice ? parseFloat(maxPrice) : null,
          buy_link: buyLink.trim() || null,
          added_by: user.id,
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Back nav */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => router.push("/items")}
          className="text-zinc-500 dark:text-zinc-600 text-xs hover:text-black dark:hover:text-white transition-colors duration-100"
        >
          ← ITEMS
        </button>
      </div>

      {/* Header */}
      <div className="px-3 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold text-black dark:text-white tracking-wide">
          NEW ITEM
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
          Add something to the archive
        </p>
      </div>

      {/* Form */}
      <div className="px-3 py-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
            NAME <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Carhartt WIP Detroit Jacket"
            className="w-full px-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-colors duration-100 bg-white dark:bg-black"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
            BRAND
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Carhartt WIP"
            className="w-full px-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-colors duration-100 bg-white dark:bg-black"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
            CATEGORY
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm text-black dark:text-white border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none appearance-none cursor-pointer transition-colors duration-100 bg-white dark:bg-black"
              style={{ borderRadius: 0 }}
            >
              <option value="" className="bg-white dark:bg-zinc-900">
                Select category
              </option>
              {CATEGORIES.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-white dark:bg-zinc-900"
                >
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-zinc-400 dark:text-zinc-600 text-xs">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
            DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this? Where did it come from? What makes it interesting?"
            rows={3}
            className="w-full px-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none resize-none transition-colors duration-100 bg-white dark:bg-black"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Price Range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
              MIN PRICE (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-colors duration-100 bg-white dark:bg-black"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
              MAX PRICE (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-colors duration-100 bg-white dark:bg-black"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Buy Link */}
        <div>
          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 tracking-widest mb-1">
            BUY LINK
          </label>
          <input
            type="url"
            value={buyLink}
            onChange={(e) => setBuyLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none transition-colors duration-100 bg-white dark:bg-black"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 text-xs font-bold tracking-widest uppercase text-white transition-opacity duration-100 bg-red-600 hover:bg-red-700 disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {submitting ? "CREATING..." : "ADD TO ARCHIVE"}
        </button>

        <p className="text-xs text-zinc-500 dark:text-zinc-700 text-center">
          You can add photos and tags after creating the item
        </p>
      </div>
    </div>
  );
}
