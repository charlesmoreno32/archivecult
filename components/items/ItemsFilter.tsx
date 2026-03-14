// components/ui/ItemsFilter.tsx
"use client";

interface ItemsFilterProps {
  currentSort: string;
  onSortChange: (sort: "hot" | "new" | "fading" | "trending") => void;
}

export default function ItemsFilter({
  currentSort,
  onSortChange,
}: ItemsFilterProps) {
  const filters = [
    { value: "hot", label: "HOT" },
    { value: "new", label: "NEW" },
    { value: "fading", label: "FADING" },
    { value: "trending", label: "TRENDING" },
  ] as const;

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onSortChange(filter.value)}
          className={`
            px-4 py-2 font-mono text-xs tracking-wider
            border transition-colors
            ${
              currentSort === filter.value
                ? "bg-white text-black border-white"
                : "bg-transparent text-gray-500 border-gray-700 hover:border-white hover:text-white"
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
