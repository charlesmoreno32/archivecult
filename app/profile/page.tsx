import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VibeSelector from "@/components/ui/VibeSelector";
import Header from "@/components/shared/Header";

const TRUST_LABELS: Record<number, string> = {
  1: "NEWBIE",
  2: "CONTRIBUTOR",
  3: "TRUSTED",
  4: "MODERATOR",
  5: "LEGEND",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, clout_points, trust_level, image_upload_count, vote_count",
    )
    .eq("id", user.id)
    .single();

  // Optional: log in server terminal
  if (profileError) {
    console.log(profileError);
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="card p-6">
            <p className="text-zinc-500 text-sm">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Items count (for "Posts" card)
  const { count: itemCount } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("added_by", user.id);

  const username = profile.username || "user";
  const email = user.email || "";
  const clout = Math.floor(profile.clout_points || 0);
  const trustLevel = profile.trust_level || 1;
  const trustLabel = TRUST_LABELS[trustLevel] || "NEWBIE";

  // Map your existing stats into the template’s three cards
  const posts = itemCount || 0;
  const followers = profile.image_upload_count || 0;
  const following = profile.vote_count || 0;

  return (
    <div className="min-h-screen bg-black text-white p-4">
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
            {username[0]?.toUpperCase() || "U"}
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-xl font-semibold">@{username}</h2>
            <p className="text-zinc-400 text-sm">{email}</p>

            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-zinc-300">
                Clout: <strong>{clout.toLocaleString()}</strong>
              </span>
              <span className="text-zinc-300">
                Trust Level: <strong>{trustLevel}</strong>{" "}
                <span className="text-zinc-500">({trustLabel})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats / Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Posts</h3>
            <p className="text-2xl font-bold">{posts}</p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Followers</h3>
            <p className="text-2xl font-bold">{followers}</p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Following</h3>
            <p className="text-2xl font-bold">{following}</p>
          </div>
        </div>

        {/* Vibes */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Your Vibes</h3>
          <VibeSelector />
        </div>

        {/* Activity Feed Placeholder */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-zinc-500 text-sm">
            No activity yet. Start posting to build your cult.
          </p>
        </div>
      </div>
    </div>
  );
}
