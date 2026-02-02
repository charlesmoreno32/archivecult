"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const { data } = await supabase.auth.getSession();
    console.log(data.session); // should be null

    router.push("/"); // or "/"
    router.refresh(); // clears server session
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-400 hover:text-red-600 transition"
    >
      Log out
    </button>
  );
}
