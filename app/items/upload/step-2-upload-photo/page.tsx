// app/items/upload/step-2-upload-photo/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Step2UploadPhoto() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const itemId = searchParams.get("itemId");
  const [itemName, setItemName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load item info
  useEffect(() => {
    const storedItemId = sessionStorage.getItem("uploadItemId");

    if (!storedItemId && !itemId) {
      router.push("/items/upload/step-1-select-item");
      return;
    }

    const finalItemId = itemId || storedItemId;
    if (finalItemId) {
      sessionStorage.setItem("uploadItemId", finalItemId);

      supabase
        .from("items")
        .select("name")
        .eq("id", finalItemId)
        .single()
        .then(({ data }) => {
          if (data) setItemName(data.name);
        });
    }
  }, [itemId, router, supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !itemId) {
      setError("Missing file or item ID");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Must be signed in");
        setUploading(false);
        return;
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split(".").pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("item_images")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("item_images").getPublicUrl(filePath);

      console.log("Uploaded to:", publicUrl);

      // Store in session storage for step 3
      sessionStorage.setItem("uploadImageUrl", publicUrl);
      sessionStorage.setItem("uploadItemId", itemId);

      // Go to step 3
      router.push(`/items/upload/step-3-tag-items?itemId=${itemId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const storedItemId = sessionStorage.getItem("uploadItemId");
  const finalItemId = itemId || storedItemId;

  if (!finalItemId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/items/upload/step-1-select-item"
            className="text-xs text-zinc-600 hover:text-white transition-colors mb-3 inline-block font-mono"
          >
            ← BACK
          </Link>
          <h1 className="text-2xl font-mono tracking-tight mb-1">
            UPLOAD PHOTO
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Step 2 of 3: Choose your photo
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Item Info */}
        <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-600 font-mono mb-1">
            UPLOADING TO:
          </div>
          <div className="text-lg font-mono text-white">
            {itemName || "Loading..."}
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  selectedFile
                    ? "border-[#4A7C59] bg-[#4A7C59]/10"
                    : "border-zinc-800 hover:border-zinc-700"
                }
                ${uploading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded"
                  />
                  <div className="text-sm text-zinc-400 font-mono">
                    {selectedFile?.name}
                  </div>
                  {!uploading && (
                    <div className="text-xs text-zinc-600 font-mono">
                      Click to change image
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📸</div>
                  <div className="text-lg font-mono mb-2">
                    Click to select image
                  </div>
                  <div className="text-xs text-zinc-600 font-mono">
                    JPG, PNG, WEBP up to 10MB
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-400 text-xs font-mono rounded">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full py-4 bg-[#4A7C59] text-white font-mono text-sm hover:bg-[#3d6649] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
        >
          {uploading ? "UPLOADING..." : "CONTINUE TO TAGGING →"}
        </button>

        {/* Tips */}
        <div className="mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="text-xs font-mono text-zinc-600 mb-2">
            📌 PHOTO TIPS:
          </div>
          <ul className="text-xs font-mono text-zinc-500 space-y-1">
            <li>• Good lighting shows details clearly</li>
            <li>• Include full item or complete outfit</li>
            <li>• Multiple angles welcome</li>
            <li>• Background doesn't matter - focus on items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
