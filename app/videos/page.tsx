// app/videos/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function VideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <h1 className="text-3xl font-mono tracking-tight">VIDEOS</h1>
          <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>

        {user ? (
          /* Signed in - show normal coming soon */
          <div className="relative flex flex-col items-center justify-center px-6 py-24">
            <div className="pointer-events-none absolute inset-0 bg-red-900/10 mix-blend-multiply blur-2xl" />

            <div className="relative w-full max-w-lg border border-zinc-700 p-10 text-center bg-zinc-950">
              <span className="absolute top-4 right-4 text-xs font-bold tracking-widest text-red-600 rotate-[-5deg]">
                RAW
              </span>

              <p className="text-sm font-extrabold tracking-widest text-white">
                VIDEOS
              </p>

              <p className="mt-4 text-zinc-300 text-sm leading-relaxed">
                Video fits, lookbook clips, skate edits,
                <br />
                and archive footage will live here.
              </p>

              <p className="mt-6 text-zinc-300 text-sm font-semibold tracking-wide">
                Coming soon
              </p>

              <p className="mt-3 text-xs text-zinc-600 uppercase tracking-wide line-through">
                Under construction
              </p>
            </div>
          </div>
        ) : (
          /* Not signed in - show blurred grid with graffiti overlay */
          <div className="relative">
            {/* Fake blurred video grid in background */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 blur-lg opacity-40 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-zinc-800"
                >
                  {/* Fake video thumbnail content */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-zinc-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Graffiti overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative max-w-md mx-auto px-6">
                {/* Main graffiti text */}
                <div className="relative mb-8">
                  <h2
                    className="text-6xl md:text-7xl font-black text-white mb-2 transform -rotate-2"
                    style={{
                      fontFamily: "Impact, Arial Black, sans-serif",
                      textShadow: `
                        4px 4px 0px rgba(220, 38, 38, 0.8),
                        -2px -2px 0px rgba(0, 0, 0, 0.8),
                        0 0 20px rgba(220, 38, 38, 0.5)
                      `,
                      WebkitTextStroke: "1px rgba(0, 0, 0, 0.8)",
                      letterSpacing: "-2px",
                    }}
                  >
                    MEMBERS
                  </h2>
                  <h2
                    className="text-6xl md:text-7xl font-black text-white transform rotate-1"
                    style={{
                      fontFamily: "Impact, Arial Black, sans-serif",
                      textShadow: `
                        4px 4px 0px rgba(220, 38, 38, 0.8),
                        -2px -2px 0px rgba(0, 0, 0, 0.8),
                        0 0 20px rgba(220, 38, 38, 0.5)
                      `,
                      WebkitTextStroke: "1px rgba(0, 0, 0, 0.8)",
                      letterSpacing: "-2px",
                    }}
                  >
                    ONLY
                  </h2>

                  {/* Spray paint drip */}
                  <div
                    className="absolute -bottom-4 left-1/4 w-3 h-12 bg-red-600 opacity-70"
                    style={{
                      clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0% 100%)",
                    }}
                  />
                </div>

                {/* Subliminal message */}
                <div className="bg-black/80 border-2 border-red-600 p-6 backdrop-blur-sm">
                  <p className="text-zinc-300 text-sm font-mono mb-4 leading-relaxed">
                    Video archive locked. Sign in to view skate edits,
                    lookbooks, and raw footage.
                  </p>

                  <Link
                    href="/sign-in"
                    className="block w-full py-3 bg-red-600 text-white text-center font-mono font-bold text-sm hover:bg-red-700 transition-colors border-2 border-red-500"
                  >
                    SIGN IN TO UNLOCK
                  </Link>
                </div>

                {/* Graffiti tag in corner */}
                <div
                  className="absolute -top-8 -right-4 text-red-600 opacity-80 transform rotate-12"
                  style={{
                    fontFamily: "Impact, sans-serif",
                    fontSize: "32px",
                    textShadow: "2px 2px 0px #000",
                  }}
                >
                  🔒
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
