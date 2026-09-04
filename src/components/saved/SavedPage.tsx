"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithSeller } from "@/lib/types";
import { buildCardVM } from "@/lib/listingHelpers";
import { PlantCard } from "@/components/PlantCard";
import { useSaved } from "@/components/ListStateProvider";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_LISTINGS } from "@/lib/mockData";

export function SavedPage() {
  const supabase = createClient();
  const saved = useSaved();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!saved.ids.length) {
      setListings([]);
      setLoading(false);
      return;
    }
    if (DEMO_MODE) {
      setListings(MOCK_LISTINGS.filter((l) => saved.ids.includes(l.id)));
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("listings").select("*, seller:profiles(*)").in("id", saved.ids);
      setListings((data as unknown as ListingWithSeller[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.ids.join(",")]);

  return (
    <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 90px" }}>
      <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", margin: "0 0 6px" }}>Saved plants</h1>
      <p style={{ color: "#7A6A4E", fontSize: 15, margin: "0 0 26px" }}>{saved.ids.length ? saved.ids.length + " plants kept for later" : ""}</p>
      {!loading && listings.length === 0 ? (
        <div style={{ border: "1.5px dashed rgba(58,38,17,.22)", borderRadius: 20, padding: "70px 30px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19 }}>Nothing saved yet</div>
          <p style={{ color: "#7A6A4E", fontSize: 14.5, margin: "10px 0 20px" }}>Tap the heart on any plant to keep it here.</p>
          <Link href="/" style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 13.5, fontWeight: 700 }}>
            Back to the marketplace
          </Link>
        </div>
      ) : (
        <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 22 }}>
          {listings.map((l) => (
            <PlantCard key={l.id} vm={buildCardVM(l, [], true, Date.now())} large={false} />
          ))}
        </div>
      )}
    </main>
  );
}
