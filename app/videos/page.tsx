export default function VideosPage() {
  return (
    <div className="min-h-screen bg-white -mt-[88px] pt-[88px]">
      <div className="p-4 pt-8">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <span className="text-sm font-semibold text-zinc-400 tracking-wider">
            VIDEOS
          </span>
        </div>

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
      </div>
    </div>
  );
}
