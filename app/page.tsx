import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Test database connection
  const { data: tags, error } = await supabase.from("tags").select("count");

  const { data: items } = await supabase.from("items").select("count");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
          <span className="text-white">ARCHIVE</span>
          <span className="text-red-600">CULT</span>
        </h1>

        <p className="text-zinc-500 text-sm md:text-base">
          Underground item-first fashion + culture archive
          <br />
          "archivecult"
        </p>

        <div className="mt-8 p-6 card max-w-md mx-auto">
          <p className="text-xs text-zinc-600 mb-4">System Status:</p>
          {error ? (
            <p className="text-red-600 text-sm">
              ❌ Database Error : {error.message}{" "}
            </p>
          ) : (
            <>
              <p className="text-skaterGreen text-sm mb-2">
                ✓ Connected to Supabase
              </p>
              <p className="text-zinc-500 text-xs">
                {tags?.[0]?.count || 0} tags • {items?.[0]?.count || 0} items
              </p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-zinc-600 text-xs">
            Clout decay: 0.1% per day • 30% per year
          </p>
        </div>
      </div>
    </div>
  );
}
