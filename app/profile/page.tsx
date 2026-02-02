export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <button className="btn-secondary">Edit Profile</button>
        </div>

        {/* Profile Card */}
        <div className="card p-6 flex items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold">
            U
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-xl font-semibold">@username</h2>
            <p className="text-zinc-400 text-sm">user@email.com</p>

            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-zinc-300">
                Clout: <strong>0</strong>
              </span>
              <span className="text-zinc-300">
                Trust Level: <strong>1</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stats / Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Posts</h3>
            <p className="text-2xl font-bold">0</p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Followers</h3>
            <p className="text-2xl font-bold">0</p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Following</h3>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>

        {/* Activity Feed Placeholder */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-zinc-500 text-sm">
            No activity yet. Start posting to build your fashion cult.
          </p>
        </div>
      </div>
    </div>
  );
}
