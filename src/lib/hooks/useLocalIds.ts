"use client";

import { useCallback, useState } from "react";

function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useLocalIds(key: string) {
  const [ids, setIds] = useState<string[]>(() => readIds(key));

  const persist = useCallback(
    (next: string[]) => {
      setIds(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota / privacy-mode errors
      }
    },
    [key]
  );

  const add = useCallback((id: string) => persist(Array.from(new Set([...ids, id]))), [ids, persist]);
  const remove = useCallback((id: string) => persist(ids.filter((x) => x !== id)), [ids, persist]);
  const toggle = useCallback(
    (id: string) => (ids.includes(id) ? remove(id) : add(id)),
    [ids, add, remove]
  );
  const clear = useCallback(() => persist([]), [persist]);

  return { ids, add, remove, toggle, clear, has: (id: string) => ids.includes(id) };
}
