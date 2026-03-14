"use client";

import Link from "next/link";

export default function TabNav() {
  return (
    <nav className="flex gap-4">
      <Link
        href="/outfits"
        className="text-sm text-zinc-400 hover:text-red-500 transition"
      >
        Outfits
      </Link>
      <Link
        href="/items"
        className="text-sm text-zinc-400 hover:text-red-500 transition"
      >
        Items
      </Link>
      <Link
        href="/videos"
        className="text-sm text-zinc-400 hover:text-red-500 transition"
      >
        Videos
      </Link>
      <Link
        href="/forum"
        className="text-sm text-zinc-400 hover:text-red-500 transition"
      >
        Forum
      </Link>
      <Link
        href="/contact"
        className="text-sm text-zinc-400 hover:text-red-500 transition"
      >
        Contact
      </Link>
    </nav>
  );
}
