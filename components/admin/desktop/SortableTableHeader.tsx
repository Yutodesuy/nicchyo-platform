import React from "react";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  flex?: string;
}

export const SortableTableHeader = React.memo(function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className = "",
  flex = "0 0 150px",
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey;
  const nextDirection = !isActive ? "asc" : currentSortDirection === "asc" ? "desc" : "asc";

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none ${className}`}
      onClick={() => onSort(sortKey)}
      title={`${label}で${nextDirection === "asc" ? "昇順" : "降順"}ソート`}
      scope="col"
      style={{ flex }}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <svg
            className={`h-3 w-3 ${
              isActive && currentSortDirection === "asc" ? "text-blue-600" : "text-gray-400"
            }`}
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path d="M6 3l4 4H2z" />
          </svg>
          <svg
            className={`h-3 w-3 -mt-1 ${
              isActive && currentSortDirection === "desc" ? "text-blue-600" : "text-gray-400"
            }`}
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path d="M6 9L2 5h8z" />
          </svg>
        </div>
      </div>
    </th>
  );
});

export function useSortableData<T>(data: T[], defaultSortKey?: keyof T) {
  const [sortKey, setSortKey] = React.useState<string | null>(defaultSortKey?.toString() || null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const handleSort = React.useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        return key;
      } else {
        setSortDirection("asc");
        return key;
      }
    });
  }, []);

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aString < bString ? -1 : aString > bString ? 1 : 0;
      } else {
        return aString > bString ? -1 : aString < bString ? 1 : 0;
      }
    });
  }, [data, sortKey, sortDirection]);

  return {
    sortedData,
    sortKey,
    sortDirection,
    handleSort,
  };
}
