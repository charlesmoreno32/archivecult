"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ItemsFilterProps {
  currentSort: string;
}

export default function ItemsFilter({ currentSort }: ItemsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/items?${params.toString()}`);
  };

  return (
    <div className="flex border border-zinc-800" style={{ borderRadius: 0 }}>
      <button
        type="button"
        onClick={() => setSort("hot")}
        className={[
          "px-3 py-1 text-xs font-bold tracking-wide uppercase",
          "transition-colors duration-100",
          currentSort === "hot"
            ? "text-white"
            : "text-zinc-600 hover:text-zinc-400",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: currentSort === "hot" ? "#1a1a1a" : "transparent",
          borderRight: "1px solid #1a1a1a",
        }}
      >
        🔥 Hot
      </button>
      <button
        type="button"
        onClick={() => setSort("new")}
        className={[
          "px-3 py-1 text-xs font-bold tracking-wide uppercase",
          "transition-colors duration-100",
          currentSort === "new"
            ? "text-white"
            : "text-zinc-600 hover:text-zinc-400",
        ].join(" ")}
        style={{
          borderRadius: 0,
          backgroundColor: currentSort === "new" ? "#1a1a1a" : "transparent",
        }}
      >
        ◆ New
      </button>
    </div>
  );
}
