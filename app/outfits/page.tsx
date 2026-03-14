// app/videos/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function OutfitssPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <h1 className="text-3xl font-mono tracking-tight">OUTFITS</h1>
          <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
