"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { MODES, type Mode } from "@/lib/constants";
import { money, timeAgo } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_SELLERS, MOCK_LISTINGS } from "@/lib/mockData";

interface OfferVM {
  id: string;
  kind: "swap" | "rent";
  who: string;
  when: string;
  text: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, loading: authLoading, requireAuth } = useAuth();
  const flash = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<OfferVM[]>([]);
  const [soldTotal, setSoldTotal] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function respondSwap(id: string, status: "accepted" | "declined", uid: string) {
    if (DEMO_MODE) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      flash(status === "accepted" ? "Offer accepted" : "Offer declined");
      return;
    }
    await supabase.from("swap_offers").update({ status }).eq("id", id);
    flash(status === "accepted" ? "Offer accepted" : "Offer declined");
    load(uid);
  }
  async function respondRental(id: string, status: "confirmed" | "declined", uid: string) {
    if (DEMO_MODE) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      flash(status === "confirmed" ? "Dates confirmed" : "Request declined");
      return;
    }
    await supabase.from("rental_requests").update({ status }).eq("id", id);
    flash(status === "confirmed" ? "Dates confirmed" : "Request declined");
    load(uid);
  }

  async function load(uid: string) {
    setLoading(true);

    if (DEMO_MODE) {
      const seller = MOCK_SELLERS.kavita;
      const mine = MOCK_LISTINGS.filter((l) => l.seller_id === seller.id) as unknown as Listing[];
      setListings(mine);
      setOffers([
        {
          id: "demo-offer-1",
          kind: "swap",
          who: "Dexter",
          when: timeAgo(new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()),
          text: "Offering a rooted Philodendron cutting for your " + (mine[0]?.name || "plant") + ".",
          onAccept: () => respondSwap("demo-offer-1", "accepted", uid),
          onDecline: () => respondSwap("demo-offer-1", "declined", uid),
        },
        {
          id: "demo-offer-2",
          kind: "rent",
          who: "Shivani",
          when: timeAgo(new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString()),
          text: "Wants " + (mine[1]?.name || "your plant") + " for 5 days.",
          onAccept: () => respondRental("demo-offer-2", "confirmed", uid),
          onDecline: () => respondRental("demo-offer-2", "declined", uid),
        },
      ]);
      setSoldTotal(1240);
      setSoldCount(3);
      setLoading(false);
      return;
    }
    const { data: listingRows } = await supabase.from("listings").select("*").eq("seller_id", uid).order("created_at", { ascending: false });
    const rows = listingRows || [];
    setListings(rows);
    const ids = rows.map((r) => r.id);

    if (ids.length) {
      const { data: swaps } = await supabase
        .from("swap_offers")
        .select("id, created_at, offered_items, listing_id, offerer:profiles(name), listing:listings(name)")
        .in("listing_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      const { data: rentals } = await supabase
        .from("rental_requests")
        .select("id, created_at, term_days, delivery_date, listing_id, requester:profiles(name), listing:listings(name)")
        .in("listing_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      type SwapRow = { id: string; created_at: string; offered_items: string[]; offerer: { name: string } | null; listing: { name: string } | null };
      type RentRow = { id: string; created_at: string; term_days: number; delivery_date: string | null; requester: { name: string } | null; listing: { name: string } | null };

      const swapVMs: OfferVM[] = ((swaps as unknown as SwapRow[]) || []).map((s) => ({
        id: s.id,
        kind: "swap",
        who: s.offerer?.name || "Buyer",
        when: timeAgo(s.created_at),
        text: "Offering " + (s.offered_items || []).join(", ") + " for your " + (s.listing?.name || "plant") + ".",
        onAccept: () => respondSwap(s.id, "accepted", uid),
        onDecline: () => respondSwap(s.id, "declined", uid),
      }));
      const rentVMs: OfferVM[] = ((rentals as unknown as RentRow[]) || []).map((r) => ({
        id: r.id,
        kind: "rent",
        who: r.requester?.name || "Buyer",
        when: timeAgo(r.created_at),
        text: "Wants " + (r.listing?.name || "your plant") + " for " + r.term_days + (r.term_days > 1 ? " days" : " day") + (r.delivery_date ? " from " + r.delivery_date : "") + ".",
        onAccept: () => respondRental(r.id, "confirmed", uid),
        onDecline: () => respondRental(r.id, "declined", uid),
      }));
      setOffers([...swapVMs, ...rentVMs]);

      const { data: items } = await supabase
        .from("order_items")
        .select("price, order:orders(status, created_at)")
        .in("listing_id", ids);
      type ItemRow = { price: number; order: { status: string; created_at: string } | null };
      const paid = ((items as unknown as ItemRow[]) || []).filter((i) => i.order?.status === "paid");
      setSoldTotal(paid.reduce((t, i) => t + i.price, 0));
      setSoldCount(paid.length);
    } else {
      setOffers([]);
      setSoldTotal(0);
      setSoldCount(0);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) load(user.id);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 90px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 27, letterSpacing: "-.03em" }}>Your shelf</h1>
        <p style={{ color: "#7A6A4E", margin: "12px 0 24px" }}>Sign in to see your listings, offers and payouts.</p>
        <button onClick={() => requireAuth("in")} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          Sign in
        </button>
      </main>
    );
  }

  const activeCount = listings.filter((l) => l.status === "live").length;
  const modeCounts: Record<Mode, number> = { sale: 0, bid: 0, swap: 0, rent: 0 };
  for (const l of listings) if (l.status === "live") modeCounts[l.mode as Mode]++;
  const pendingCount = listings.filter((l) => l.status === "pending").length;

  const dashStats = [
    { label: "ACTIVE LISTINGS", n: String(activeCount), sub: `${modeCounts.sale} sale · ${modeCounts.bid} bid · ${modeCounts.swap} swap · ${modeCounts.rent} rent`, bg: "#F5EEDC" },
    { label: "PENDING REVIEW", n: String(pendingCount), sub: pendingCount ? "waiting on the team" : "nothing waiting", bg: "#F5EEDC" },
    { label: "SOLD (ALL TIME)", n: money(soldTotal), sub: soldCount + " plants handed over", bg: "#DCE3BC" },
    { label: "OPEN OFFERS", n: String(offers.length), sub: offers.filter((o) => o.kind === "swap").length + " swaps · " + offers.filter((o) => o.kind === "rent").length + " rentals", bg: "#F5A644" },
  ];

  return (
    <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30, flexWrap: "wrap" }}>
        <img src={profile?.avatar_url || "/img/potting-shop.jpg"} alt={profile?.name} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 27, letterSpacing: "-.03em", margin: 0 }}>Morning, {profile?.first_name || "there"}</h1>
          <div style={{ color: "#7A6A4E", fontSize: 14, marginTop: 4 }}>
            {profile?.region || "Trinidad & Tobago"} · ★ {(profile?.rating ?? 5).toFixed(1)}
          </div>
        </div>
        <button onClick={() => router.push("/sell")} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "14px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Post a plant
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#7A6A4E" }}>Loading…</div>
      ) : (
        <>
          <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 20, marginBottom: 34 }}>
            {dashStats.map((s) => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 18, padding: 22 }}>
                <div style={{ color: s.bg === "#F5A644" ? "rgba(253,249,238,.75)" : "#7A6A4E", fontSize: 11, fontWeight: 700, letterSpacing: ".12em" }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 25, letterSpacing: "-.03em", color: s.bg === "#F5A644" ? "#FDF9EE" : "#3A2611", marginTop: 9, lineHeight: 1 }}>{s.n}</div>
                <div style={{ color: s.bg === "#F5A644" ? "rgba(253,249,238,.8)" : "#7A6A4E", fontSize: 12.5, marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div data-r="split" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
            <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", background: "#F5EEDC", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "#7A6A4E" }}>MY LISTINGS</div>
              {listings.length === 0 ? (
                <div style={{ padding: "24px 20px", color: "#7A6A4E" }}>Nothing posted yet.</div>
              ) : (
                listings.map((l) => {
                  const m = MODES[l.mode as Mode];
                  return (
                    <Link
                      key={l.id}
                      href={"/listing/" + l.id}
                      style={{ display: "flex", alignItems: "center", gap: 15, padding: "14px 20px", borderTop: "1px solid rgba(58,38,17,.1)", color: "inherit" }}
                    >
                      <img src={l.images?.[0] || "/img/pink-princess.jpg"} alt={l.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{l.name}</div>
                        <div style={{ color: "#7A6A4E", fontSize: 12.5, marginTop: 3 }}>
                          {l.region} · {l.status === "pending" ? "in review" : l.status}
                        </div>
                      </div>
                      <span style={{ background: m.bg, color: m.fg, padding: "5px 11px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: ".1em" }}>{m.badge}</span>
                      <span style={{ fontWeight: 700, fontSize: 14.5, minWidth: 88, textAlign: "right" }}>
                        {l.mode === "swap" ? "Up for trade" : money(l.price ?? l.start_bid)}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", background: "#F5EEDC", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "#7A6A4E" }}>OFFERS &amp; REQUESTS</div>
                {offers.length === 0 ? (
                  <div style={{ padding: "18px 20px", color: "#7A6A4E", fontSize: 13.5 }}>Nothing waiting on you.</div>
                ) : (
                  offers.map((o) => (
                    <div key={o.id} style={{ padding: "15px 20px", borderTop: "1px solid rgba(58,38,17,.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14.5 }}>{o.who}</span>
                        <span style={{ color: "#6F6249", fontSize: 11.5 }}>{o.when}</span>
                      </div>
                      <div style={{ color: "#63543A", fontSize: 13.5, lineHeight: 1.45, marginTop: 5 }}>{o.text}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                        <button onClick={o.onAccept} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "9px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                          Accept
                        </button>
                        <button onClick={o.onDecline} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "9px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pl-dark" style={{ background: "#3A2611", borderRadius: 20, padding: 22, color: "#FDF9EE" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "rgba(253,249,238,.6)" }}>WIPAY PAYOUT</div>
                <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 24, color: "#B0C35C", margin: "9px 0 6px" }}>{money(soldTotal * 0.92)}</div>
                <div style={{ color: "rgba(253,249,238,.65)", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                  After the 8% transaction fee on {soldCount} completed sale{soldCount === 1 ? "" : "s"} (courier deliveries carry another 8%). Rental deposits are held separately until each plant comes back.
                </div>
                <button style={{ border: "1px solid rgba(253,249,238,.3)", background: "none", color: "#FDF9EE", padding: "11px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Payout settings
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
