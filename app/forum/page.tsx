import Link from "next/link";

const BOARDS = [
  {
    id: "item-discussion",
    name: "Item Discussion",
    description: "Talk about specific items in the archive",
    posts: 0,
    lastPost: null,
  },
  {
    id: "fit-pics",
    name: "Fit Pics",
    description: "Share how you're wearing it",
    posts: 0,
    lastPost: null,
  },
  {
    id: "what-is-vibe",
    name: "What is this vibe?",
    description: "Name the aesthetic, find the words",
    posts: 0,
    lastPost: null,
  },
  {
    id: "brand-discovery",
    name: "Brand Discovery",
    description: "Found something? Share it here",
    posts: 0,
    lastPost: null,
  },
  {
    id: "archive-material",
    name: "Archive Material",
    description: "Deep cuts, rare finds, history",
    posts: 0,
    lastPost: null,
  },
  {
    id: "general",
    name: "General",
    description: "Anything goes",
    posts: 0,
    lastPost: null,
  },
];

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            FORUM
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Discuss items, share fits, and build the archive together
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Posts</p>
            <p className="text-2xl font-bold">
              {BOARDS.reduce((sum, b) => sum + b.posts, 0)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-zinc-500 mb-1">Active Boards</p>
            <p className="text-2xl font-bold">{BOARDS.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-zinc-500 mb-1">Online</p>
            <p className="text-2xl font-bold">—</p>
          </div>
        </div>

        {/* Boards Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest px-1 mb-4">
            BOARDS
          </h2>

          {BOARDS.map((board) => (
            <div
              key={board.id}
              className="card border border-zinc-800 hover:border-zinc-700 transition p-4 group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    href={`/forum/${board.id}`}
                    className="group inline-block"
                  >
                    <h3 className="font-bold text-base group-hover:text-red-500 transition">
                      {board.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-500 mt-1">
                    {board.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{board.posts}</p>
                  <p className="text-xs text-zinc-600">posts</p>
                </div>
              </div>

              {board.lastPost && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-600">
                    Last post: {board.lastPost}
                  </p>
                </div>
              )}

              {board.posts === 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-900">
                  <p className="text-xs text-zinc-700 italic">
                    No posts yet — be the first to start discussing
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 p-6 card border border-zinc-800 text-center">
          <h3 className="font-bold text-lg mb-2">Ready to discuss?</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Sign in to create threads and join the conversation
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 transition font-semibold text-sm"
          >
            Sign In
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 text-center text-xs text-zinc-600 border-t border-zinc-900">
          <p>Forums are read-only for now. Moderation system coming soon.</p>
        </div>
      </div>
    </div>
  );
}
