"use client";

import { createContext, useContext } from "react";
import { useLocalIds } from "@/lib/hooks/useLocalIds";

type IdListApi = {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

const CartContext = createContext<IdListApi | null>(null);
const SavedContext = createContext<IdListApi | null>(null);

export function ListStateProvider({ children }: { children: React.ReactNode }) {
  const cart = useLocalIds("pl-cart");
  const saved = useLocalIds("pl-saved");
  return (
    <CartContext.Provider value={cart}>
      <SavedContext.Provider value={saved}>{children}</SavedContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within ListStateProvider");
  return ctx;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within ListStateProvider");
  return ctx;
}
