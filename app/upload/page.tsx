"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UploadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const preItemId = searchParams.get("item");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    preItemId,
  );
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string | null }[]
  >([]);
  const [searching, setSearching] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If pre-selected item, fetch its name
  useEffect(() => {
    if (preItemId) {
      supabase
        .from("items")
        .select("name")
        .eq("id", preItemId)
        .single()
        .then(({ data }) => {
          if (data) setSelectedItemName(data.name);
        });
    }
  }, [preItemId]);

  // Search items as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("items")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validate
    if (!f.type.startsWith("image/")) {
      setError("Only images allowed");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Max 10MB");
      return;
    }

    setFile(f);
    setError(null);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file || !selectedItemId) {
      setError(!file ? "Select a photo" : "Select an item");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Sign in to upload");
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("item-photos")
        .getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // Check trust level for auto-approve
      const { data: profile } = await supabase
        .from("profiles")
        .select("trust_level")
        .eq("id", session.user.id)
        .single();

      const trustLevel = profile?.trust_level || 1;
      const autoApprove = trustLevel >= 3;

      // Insert into item_images
      const { error: insertError } = await supabase.from("item_images").insert({
        item_id: selectedItemId,
        image_url: imageUrl,
        uploaded_by: session.user.id,
        is_approved: autoApprove,
        needs_approval: !autoApprove,
        upvotes: 0,
        downvotes: 0,
      });

      if (insertError) {
        setError(`Failed to save: ${insertError.message}`);
        setUploading(false);
        return;
      }

      // Update item image_count
      await supabase
        .from("items")
        .update({ image_count: supabase.rpc ? undefined : undefined })
        .eq("id", selectedItemId);

      // Update profile upload count
      await supabase
        .from("profiles")
        .update({ image_upload_count: profile?.trust_level ? 1 : 0 })
        .eq("id", session.user.id);

      setSuccess(true);
      setUploading(false);

      // Redirect to item after a moment
      setTimeout(() => {
        router.push(`/items/${selectedItemId}`);
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-white mb-2">UPLOADED</p>
          <p className="text-xs text-zinc-500">Redirecting to item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Back nav */}
      <div
        className="px-3 py-2 border-b border-zinc-800"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="text-zinc-600 text-xs hover:text-white transition-colors duration-100"
        >
          ← BACK
        </button>
      </div>

      {/* Header */}
      <div className="px-3 py-4 border-b border-zinc-800">
        <h1
          className="text-lg font-bold text-white"
          style={{ letterSpacing: "-0.5px" }}
        >
          UPLOAD PHOTO
        </h1>
        <p className="text-xs text-zinc-600 mt-1">
          Add a photo to an item in the archive
        </p>
      </div>

      <div className="px-3 py-4 space-y-5">
        {/* Item selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            ITEM <span style={{ color: "#d32f2f" }}>*</span>
          </label>

          {selectedItemId ? (
            <div
              className="flex items-center justify-between px-3 py-2 border border-zinc-800"
              style={{ borderRadius: 0, backgroundColor: "#0a0a0a" }}
            >
              <span className="text-xs text-white">
                {selectedItemName || "Item selected"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedItemId(null);
                  setSelectedItemName(null);
                }}
                className="text-xs text-zinc-600 hover:text-white transition-colors duration-100"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for an item..."
                className="w-full px-3 py-2 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors duration-100"
                style={{ borderRadius: 0, backgroundColor: "#000000" }}
              />

              {/* Dropdown results */}
              {(searchResults.length > 0 || searching) && (
                <div
                  className="absolute left-0 right-0 top-full border border-zinc-800 z-20"
                  style={{ borderRadius: 0, backgroundColor: "#0a0a0a" }}
                >
                  {searching && (
                    <p className="px-3 py-2 text-xs text-zinc-700">
                      Searching...
                    </p>
                  )}
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setSelectedItemName(item.name);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="block w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors duration-100"
                    >
                      {item.name || "Untitled"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 tracking-widest mb-1">
            PHOTO <span style={{ color: "#d32f2f" }}>*</span>
          </label>

          {!preview ? (
            <label className="block">
              <div
                className="flex flex-col items-center justify-center py-8 border border-dashed border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors duration-100"
                style={{ borderRadius: 0 }}
              >
                <span className="text-zinc-600 text-xs tracking-widest">
                  📸 TAP TO ADD PHOTO
                </span>
                <span className="text-zinc-700 text-xs mt-1">
                  Max 10MB · JPG, PNG, WEBP
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
          ) : (
            <div>
              {/* Preview */}
              <div
                className="relative w-full overflow-hidden"
                style={{ borderRadius: 0 }}
              >
                <img
                  src={preview}
                  alt="preview"
                  className="w-full"
                  style={{
                    maxHeight: "300px",
                    objectFit: "cover",
                    filter: "contrast(1.05) brightness(0.9)",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)",
                  }}
                />
              </div>
              {/* Change photo */}
              <label className="block mt-2">
                <span className="text-xs text-zinc-500 hover:text-white transition-colors duration-100 cursor-pointer">
                  Change photo →
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs" style={{ color: "#d32f2f" }}>
            {error}
          </p>
        )}

        {/* Upload button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 text-xs font-bold tracking-widest uppercase text-black transition-opacity duration-100"
          style={{
            borderRadius: 0,
            backgroundColor: uploading ? "#333" : "#4A7C59",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? "UPLOADING..." : "UPLOAD"}
        </button>

        <p className="text-xs text-zinc-700 text-center">
          Trust level 3+ photos are auto-approved
        </p>
      </div>
    </div>
  );
}
