"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithSeller } from "@/lib/types";
import { MODES } from "@/lib/constants";
import { money } from "@/lib/format";
import { useCart } from "@/components/ListStateProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_LISTINGS } from "@/lib/mockData";

export function BasketPage() {
  const supabase = createClient();
  const cart = useCart();
  const { user, requireAuth } = useAuth();
  const flash = useToast();

  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    if (!cart.ids.length) {
      setListings([]);
      setLoading(false);
      return;
    }
    if (DEMO_MODE) {
      setListings(MOCK_LISTINGS.filter((l) => cart.ids.includes(l.id)));
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("listings").select("*, seller:profiles(*)").in("id", cart.ids);
      setListings((data as unknown as ListingWithSeller[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ids.join(",")]);

  const sub = listings.reduce((t, l) => t + (l.price || 0), 0);
  const deliv = listings.length ? 60 : 0;
  const total = sub + deliv;

  async function payNow() {
    if (!listings.length) return flash("Your basket is empty");
    requireAuth("in", {
      onSuccess: async () => {
        if (DEMO_MODE) {
          setOrdered(true);
          cart.clear();
          window.scrollTo(0, 0);
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        const { data: order, error } = await supabase.from("orders").insert({ buyer_id: uid, total, status: "paid" }).select("id").single();
        if (error) return flash(error.message);
        await supabase
          .from("order_items")
          .insert(listings.map((l) => ({ order_id: order.id, listing_id: l.id, price: l.price || 0 })));
        setOrdered(true);
        cart.clear();
        window.scrollTo(0, 0);
      },
    });
  }

  if (ordered) {
    return (
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "26px 32px 90px" }}>
        <div className="pl-rise" style={{ textAlign: "center", padding: "56px 0" }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#B0C35C", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700, margin: "0 auto 24px" }}>✓</div>
          <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 30, letterSpacing: "-.03em", margin: "0 0 12px" }}>Paid</h1>
          <p style={{ color: "#63543A", fontSize: 16, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>
            WiPay took the payment and each grower has been told. They&apos;ll message you to arrange courier or collection.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/messages" style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
              Open messages
            </Link>
            <button onClick={() => setOrdered(false)} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Back to the marketplace
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "26px 32px 90px" }}>
      <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", margin: "0 0 24px" }}>Your basket</h1>
      {!loading && listings.length === 0 ? (
        <div style={{ border: "1.5px dashed rgba(58,38,17,.22)", borderRadius: 20, padding: "70px 30px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19 }}>Nothing in here yet</div>
          <p style={{ color: "#7A6A4E", fontSize: 14.5, margin: "10px 0 20px" }}>Plants for sale go straight in. Bids, swaps and rentals are handled on their own listing.</p>
          <Link href="/" style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 13.5, fontWeight: 700 }}>
            Browse plants
          </Link>
        </div>
      ) : listings.length ? (
        <div data-r="split" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 12 }}>
            {listings.map((l) => {
              const m = MODES[l.mode as keyof typeof MODES];
              return (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(58,38,17,.14)", borderRadius: 16, padding: 14 }}>
                  <Link href={"/listing/" + l.id} style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0, color: "inherit" }}>
                    <img src={l.images?.[0] || "/img/jungle.png"} alt={l.name} style={{ width: 78, height: 78, borderRadius: 12, objectFit: "cover" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "inline-block", background: m.bg, color: m.fg, padding: "4px 10px", borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em" }}>{m.badge}</span>
                      <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 600, fontSize: 16, marginTop: 7 }}>{l.name}</div>
                      <div style={{ color: "#7A6A4E", fontSize: 12.5, marginTop: 3 }}>
                        {l.seller?.name} · {l.region}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{money(l.price)}</div>
                  </Link>
                  <button
                    onClick={() => {
                      cart.remove(l.id);
                      flash("Removed from basket");
                    }}
                    title="Remove"
                    style={{ border: "1px solid rgba(58,38,17,.18)", background: "none", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", color: "#7A6A4E", flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ position: "sticky", top: 106, display: "grid", gap: 14 }}>
            <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 18, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", fontSize: 14.5, color: "#63543A" }}>
                <span>Plants ({listings.length})</span>
                <span>{money(sub)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", fontSize: 14.5, color: "#63543A" }}>
                <span>Courier, one drop</span>
                <span>{money(deliv)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", fontSize: 14.5, color: "#3A2611", fontWeight: 700, borderTop: "1px solid rgba(58,38,17,.14)" }}>
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <button onClick={payNow} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: 17, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Pay with WiPay
            </button>
            <div style={{ background: "#F5EEDC", borderRadius: 14, padding: 16, fontSize: 13, lineHeight: 1.5, color: "#63543A" }}>
              Card, bank transfer or cash on pickup, you choose per grower at handover. Money is only released once you confirm the plant reached you.
            </div>
          </div>
        </div>
      ) : null}
      {!user ? <p style={{ color: "#7A6A4E", fontSize: 13, marginTop: 20 }}>You&apos;ll be asked to sign in when you pay.</p> : null}
    </main>
  );
}
