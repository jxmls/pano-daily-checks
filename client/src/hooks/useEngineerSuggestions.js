import { useMemo } from "react";

const MIN_SUGGEST_CHARS = 3;

export const ENGINEERS = [
  { name: "Jose Lucar",  email: "jose.lucar@panoptics.com" },
  { name: "Alex Field",  email: "alex.field@panoptics.com" },
  { name: "Mihir Sangani", email: "mihir.sangani@panoptics.com" },
];
export function useEngineerSuggestions(query, options) {
  const q = (query || "").trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (q.length < MIN_SUGGEST_CHARS) return [];
    const score = (name) => {
      const i = name.toLowerCase().indexOf(q);
      return i === 0 ? -1 : i; // names that start with the query first
    };
    return (options || [])
      .filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
      .sort((a, b) => score(a) - score(b))
      .slice(0, 5);
  }, [q, options]);

  const showSoftWarning = q.length >= MIN_SUGGEST_CHARS && suggestions.length === 0;

  return { suggestions, showSoftWarning };
}
