'use client';

import { Input } from '@repo/shadcn/input';
import { cn } from '@repo/shadcn/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface DataTableSearchProps {
  title?: string;
  searchKey: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setPage?: (value: number) => void;
  w?: string;
}

const SEARCH_DEBOUNCE_MS = 400;

/*************  ✨ Command ⭐  *************/
/**
 * A search input for a DataTable.
 *
 * @remarks
 *
 * This component allows users to search the table by keyword. The input value
 * is kept in local state so typing is never blocked by URL updates. The search
 * is debounced (400ms) before dispatching to the URL/filters, allowing the user
 * to type complete words without losing focus.
 *
 * The page reset is handled by each module's `setFilters` (which resets to page
 * 1 when the search filter changes) — calling `setPage` separately would
 * overwrite the freshly-set search param due to stale `searchParams` in
 * `useSearchParams`-based filters.
 **/

export function DataTableSearch({
  searchQuery,
  setSearchQuery,
  title = 'Buscar',
  w = 'w-72 md:max-w-sm',
}: DataTableSearchProps) {
  const [localValue, setLocalValue] = useState(searchQuery ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(searchQuery ?? '');
  }, [searchQuery]);

  const handleChange = (value: string) => {
    setLocalValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Input
      placeholder={`${title}...`}
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(w)}
    />
  );
}
