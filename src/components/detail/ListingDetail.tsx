"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithSeller } from "@/lib/types";
import { MODES, type Mode } from "@/lib/constants";
import { money, countdown, timeAgo, initials } from "@/lib/format";
import { buildCardVM, highBid } from "@/lib/listingHelpers";
import { PlantCard } from "@/components/PlantCard";
import { useAuth } from "@/components/AuthProvider";
import { useCart, useSaved } from "@/components/ListStateProvider";
import { useToast } from "@/components/ToastProvider";
import { ensureThread } from "@/lib/messaging";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_LISTINGS, MOCK_BIDS } from "@/lib/mockData";

const ALL_IMAGES = ["/img/gloriosum.png", "/img/cone.png", "/img/selloum.png", "/img/jungle.png", "/img/carry.png"];

interface BidRow {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  bidder_name: string;
}

export function ListingDetail({ id }: { id: string }) {
  const supabase = createClient();
  const router = useRouter();
  const { requireAuth } = useAuth();
  const cart = useCart();
  const saved = useSaved();
  const flash = useToast();

  const [listing, setListing] = useState<ListingWithSeller | null>(null);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [related, setRelated] = useState<ListingWithSeller[]>([]);
  const [sellerCount, setSellerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [thumbIdx, setThumbIdx] = useState(0);
  const [bidTyped, setBidTyped] = useState("");
  const [swapOfferText, setSwapOfferText] = useState("");
  const [swapSent, setSwapSent] = useState(false);
  const [rentTerm, setRentTerm] = useState(1);
  const [rentDate, setRentDate] = useState("");
  const [rentRegion, setRentRegion] = useState("Port of Spain");
  const [rentSent, setRentSent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    setLoading(true);
    if (DEMO_MODE) {
      const row = MOCK_LISTINGS.find((l) => l.id === id) || null;
      if (!row) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setListing(row);
      setRentRegion(row.region);
      setBids((MOCK_BIDS[id] || []).slice().sort((a, b) => b.amount - a.amount));
      setRelated(MOCK_LISTINGS.filter((l) => l.id !== id).slice(0, 4));
      setSellerCount(MOCK_LISTINGS.filter((l) => l.seller_id === row.seller_id).length);
      setThumbIdx(0);
      setSwapSent(false);
      setRentSent(false);
      setBidTyped("");
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("listings").select("*, seller:profiles(*)").eq("id", id).maybeSingle();
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const row = data as unknown as ListingWithSeller;
    setListing(row);
    setRentRegion(row.region);

    const { data: bidRows } = await supabase
      .from("bids")
      .select("id, amount, created_at, bidder_id, bidder:profiles(name)")
      .eq("listing_id", id)
      .order("amount", { ascending: false });
    setBids(
      ((bidRows as unknown as { id: string; amount: number; created_at: string; bidder_id: string; bidder: { name: string } | null }[]) || []).map((b) => ({
        id: b.id,
        amount: b.amount,
        created_at: b.created_at,
        bidder_id: b.bidder_id,
        bidder_name: b.bidder?.name || "Buyer",
      }))
    );

    const { data: relatedRows } = await supabase
      .from("listings")
      .select("*, seller:profiles(*)")
      .eq("status", "live")
      .neq("id", id)
      .limit(4);
    setRelated((relatedRows as unknown as ListingWithSeller[]) || []);

    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", row.seller_id)
      .eq("status", "live");
    setSellerCount(count || 0);

    setThumbIdx(0);
    setSwapSent(false);
    setRentSent(false);
    setBidTyped("");
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const gallery = useMemo(() => {
    if (!listing) return [ALL_IMAGES[0]];
    return listing.images?.length ? listing.images : [ALL_IMAGES[0]];
  }, [listing]);

  if (loading) {
    return <div style={{ padding: "80px 32px", textAlign: "center", color: "#7A6A4E" }}>Loading…</div>;
  }
  if (notFound || !listing) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 22 }}>Plant not found</div>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, color: "#4F6E24", fontWeight: 700 }}>
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const mode = listing.mode as Mode;
  const m = MODES[mode];
  const favored = saved.has(listing.id);
  const high = highBid(listing, bids);
  const inCart = cart.has(listing.id);

  const seller = listing.seller;

  async function placeBid(amount: number) {
    if (!listing) return;
    if (amount <= high) return flash("Your bid must be higher than " + money(high));
    requireAuth("in", {
      onSuccess: async () => {
        if (DEMO_MODE) {
          setBids((prev) => [{ id: "demo-" + Date.now(), amount, created_at: new Date().toISOString(), bidder_id: "you", bidder_name: "You" }, ...prev].sort((a, b) => b.amount - a.amount));
          flash("You are the high bidder. Card pre-authorised via WiPay.");
          setBidTyped("");
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        const { error } = await supabase.from("bids").insert({ listing_id: listing.id, bidder_id: uid, amount });
        if (error) return flash(error.message);
        flash("You are the high bidder. Card pre-authorised via WiPay.");
        setBidTyped("");
        load();
      },
    });
  }

  async function sendSwapOffer() {
    if (!listing) return;
    const items = swapOfferText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return flash("Say what you're offering off your shelf first");
    requireAuth("in", {
      onSuccess: async () => {
        if (DEMO_MODE) {
          setSwapSent(true);
          flash("Offer sent to " + seller.first_name);
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        const { error } = await supabase.from("swap_offers").insert({ listing_id: listing.id, offerer_id: uid, offered_items: items });
        if (error) return flash(error.message);
        setSwapSent(true);
        flash("Offer sent to " + seller.first_name);
      },
    });
  }

  async function sendRentRequest() {
    if (!listing) return;
    requireAuth("in", {
      onSuccess: async () => {
        if (DEMO_MODE) {
          setRentSent(true);
          flash("Request sent to " + seller.first_name);
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        const { error } = await supabase.from("rental_requests").insert({
          listing_id: listing.id,
          requester_id: uid,
          term_days: rentTerm,
          delivery_date: rentDate || null,
          drop_region: rentRegion,
        });
        if (error) return flash(error.message);
        setRentSent(true);
        flash("Request sent to " + seller.first_name);
      },
    });
  }

  function addToBasket() {
    if (inCart) {
      router.push("/basket");
      return;
    }
    cart.add(listing!.id);
    flash("Added to basket. Pay with WiPay at checkout.");
  }

  async function goChat() {
    requireAuth("in", {
      onSuccess: async () => {
        if (DEMO_MODE) {
          flash("Messaging is disabled in demo mode");
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid || !listing) return;
        if (uid === listing.seller_id) {
          router.push("/messages");
          return;
        }
        const threadId = await ensureThread(supabase, uid, listing.seller_id, listing.id);
        router.push("/messages" + (threadId ? "?thread=" + threadId : ""));
      },
    });
  }

  const specs = [
    { label: "SIZE", value: listing.size || "—" },
    { label: "CARE", value: listing.care || "—" },
    { label: "LIGHT", value: listing.light || "—" },
    { label: "POT", value: mode === "rent" ? "Matte black urn" : '6" nursery pot' },
    { label: "HANDOVER", value: mode === "rent" ? "Delivered by van" : "Collect or courier" },
    { label: "LISTED", value: timeAgo(listing.created_at) },
  ];

  const days = rentTerm;
  const sub = (listing.price || 0) * days;
  const dep = 500;
  const deliv = 150;
  const rentLines = [
    { label: money(listing.price) + " × " + days + (days > 1 ? " days" : " day"), value: money(sub) },
    { label: "Delivery & collection", value: money(deliv) },
    { label: "Refundable deposit", value: money(dep) },
  ];
  const rentTotal = sub + deliv + dep;

  const typedNum = +bidTyped || 0;
  const bidValid = typedNum > high;
  const quickBidAmounts = [50, 100, 250].map((inc) => high + inc);

  const payTitle = mode === "swap" ? "HANDOVER" : "PAY WITH";
  const payMethods =
    mode === "swap"
      ? ["Meet up in person", "Labelled & pest-free", "Rooted or unrooted"]
      : mode === "rent"
      ? ["WiPay card", "Refundable deposit", "Bank transfer"]
      : ["WiPay card", "Bank transfer", "Cash on pickup"];

  return (
    <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 90px" }}>
      <Link href="/" style={{ border: 0, background: "none", color: "#7A6A4E", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", padding: 0, marginBottom: 20, display: "inline-block" }}>
        ← BACK TO MARKETPLACE
      </Link>
      <div data-r="split" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 52, alignItems: "start" }}>
        <div>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#EBE2CE", aspectRatio: "4/5" }}>
            <img src={gallery[thumbIdx] || gallery[0]} alt={listing.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {gallery.length > 1 ? (
            <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 10 }}>
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setThumbIdx(i)}
                  style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "2px solid " + (i === thumbIdx ? "#6A9331" : "transparent"), cursor: "pointer", padding: 0 }}
                >
                  <img src={img} alt="View" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          ) : null}
          <div style={{ marginTop: 26 }}>
            <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 18, margin: "0 0 12px" }}>About this plant</h2>
            <p style={{ color: "#63543A", fontSize: 15.5, lineHeight: 1.65, margin: "0 0 20px" }}>{listing.blurb}</p>
            <div data-r="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(58,38,17,.14)", border: "1px solid rgba(58,38,17,.14)", borderRadius: 14, overflow: "hidden" }}>
              {specs.map((s) => (
                <div key={s.label} style={{ background: "#FDF9EE", padding: "15px 17px" }}>
                  <div style={{ color: "#6F6249", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em" }}>{s.label}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 5 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ display: "inline-block", background: m.bg, color: m.fg, padding: "6px 13px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em" }}>{m.badge}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  saved.toggle(listing.id);
                  flash(favored ? "Removed from saved" : "Saved to your list");
                }}
                style={{ border: "1px solid rgba(58,38,17,.18)", background: "none", padding: "9px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: favored ? "#F5A644" : "#3A2611" }}
              >
                {favored ? "♥" : "♡"} {favored ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") navigator.clipboard?.writeText(window.location.href).catch(() => {});
                  flash("Link copied, paste it in your WhatsApp status");
                }}
                style={{ border: "1px solid rgba(58,38,17,.18)", background: "none", padding: "9px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                ↗ Share
              </button>
            </div>
          </div>
          <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 32, letterSpacing: "-.032em", lineHeight: 1.02, margin: "16px 0 6px" }}>{listing.name}</h1>
          <div style={{ color: "#6F6249", fontSize: 15, fontStyle: "italic" }}>
            {listing.latin_name} · {listing.region}
          </div>

          {mode === "sale" ? (
            <div style={{ marginTop: 26 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em" }}>{money(listing.price)}</span>
                <span style={{ color: "#7A6A4E", fontSize: 14 }}>plus delivery, or collect free</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={addToBasket} style={{ flex: 1, border: 0, background: "#6A9331", color: "#F5EEDC", padding: 17, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  {inCart ? "✓ In your basket, view it" : "Add to basket: " + money(listing.price)}
                </button>
                <button onClick={goChat} style={{ border: "1.5px solid #6A9331", background: "none", padding: "17px 22px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Message seller
                </button>
              </div>
            </div>
          ) : null}

          {mode === "bid" ? (
            <>
              <div className="pl-dark" style={{ marginTop: 24, background: "#3A2611", borderRadius: 18, padding: 24, color: "#FDF9EE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                  <div>
                    <div style={{ color: "rgba(253,249,238,.6)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em" }}>CURRENT BID</div>
                    <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 29, letterSpacing: "-.03em", color: "#B0C35C", lineHeight: 1.15 }}>{money(high)}</div>
                    <div style={{ color: "rgba(253,249,238,.6)", fontSize: 13, marginTop: 3 }}>
                      {bids.length} bids · opened at {money(listing.start_bid || 0)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "rgba(253,249,238,.6)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em" }}>TIME LEFT</div>
                    <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 21, color: "#F5A644", lineHeight: 1.4 }}>{countdown(listing.ends_at, now)}</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(253,249,238,.14)", margin: "20px 0" }} />
                <div style={{ display: "flex", gap: 9, marginBottom: 11 }}>
                  {quickBidAmounts.map((amt, i) => (
                    <button
                      key={i}
                      onClick={() => setBidTyped(String(amt))}
                      style={{
                        flex: 1,
                        border: "1px solid rgba(253,249,238,.25)",
                        background: +bidTyped === amt ? "#B0C35C" : "transparent",
                        color: +bidTyped === amt ? "#3A2611" : "#FDF9EE",
                        padding: 12,
                        borderRadius: 11,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +{money([50, 100, 250][i])}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "rgba(253,249,238,.6)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", marginBottom: 7 }}>OR ENTER YOUR OWN BID</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(253,249,238,.08)",
                      border: "1px solid " + (!bidTyped ? "rgba(253,249,238,.25)" : bidValid ? "#B0C35C" : "#F5A644"),
                      borderRadius: 12,
                      padding: "12px 15px",
                    }}
                  >
                    <span style={{ color: "rgba(253,249,238,.6)", fontSize: 14.5, fontWeight: 700, flexShrink: 0 }}>TT$</span>
                    <input
                      type="number"
                      value={bidTyped}
                      onChange={(e) => setBidTyped(e.target.value)}
                      aria-label="Your bid in Trinidad and Tobago dollars"
                      aria-describedby="bid-hint"
                      min={high + 1}
                      placeholder={String(high + 50) + " or more"}
                      style={{ border: 0, background: "none", outline: "none", width: "100%", minWidth: 0, color: "#FDF9EE", fontSize: 15.5, fontWeight: 700, fontFamily: "inherit" }}
                    />
                  </div>
                  <div id="bid-hint" role="status" aria-live="polite" style={{ color: !bidTyped ? "rgba(253,249,238,.55)" : bidValid ? "#B0C35C" : "#F5A644", fontSize: 12, lineHeight: 1.45, marginTop: 7 }}>
                    {!bidTyped
                      ? "Must beat the current high bid of " + money(high) + "."
                      : bidValid
                      ? "Valid bid: " + money(typedNum) + ", " + money(typedNum - high) + " above the current high."
                      : "Too low. The current high bid is " + money(high) + ", so bid " + money(high + 1) + " or more."}
                  </div>
                </div>
                <button
                  onClick={() => placeBid(typedNum)}
                  disabled={!bidValid}
                  style={{ width: "100%", border: 0, background: "#F5A644", color: "#FDF9EE", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: bidValid ? "pointer" : "not-allowed", opacity: bidValid ? 1 : 0.6 }}
                >
                  {bidValid ? "Place bid of " + money(typedNum) : "Pick or enter an amount to bid"}
                </button>
                <div style={{ color: "rgba(253,249,238,.55)", fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>Card pre-authorised through WiPay when you bid. Charged only if you win.</div>
              </div>
              <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 16, overflow: "hidden", marginTop: 16 }}>
                <div style={{ padding: "13px 18px", background: "#F5EEDC", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", color: "#7A6A4E" }}>BID HISTORY</div>
                {bids.length === 0 ? (
                  <div style={{ padding: "16px 18px", color: "#7A6A4E", fontSize: 13.5 }}>No bids yet. Be the first.</div>
                ) : (
                  bids.map((b) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 18px", borderTop: "1px solid rgba(58,38,17,.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#6A9331", color: "#F5EEDC", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{initials(b.bidder_name)}</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{b.bidder_name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                        <span style={{ color: "#6F6249", fontSize: 12.5 }}>{timeAgo(b.created_at)}</span>
                        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{money(b.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={goChat} style={{ width: "100%", marginTop: 12, border: "1.5px solid #6A9331", background: "none", padding: 15, borderRadius: 14, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                Message seller
              </button>
            </>
          ) : null}

          {mode === "swap" ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ background: "#DCE3BC", borderRadius: 18, padding: 22 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", color: "#7A6A4E", marginBottom: 8 }}>UP FOR TRADE</div>
                <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19, marginBottom: 12 }}>{seller.name}&apos;s wishlist</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {(listing.wants || []).map((w) => (
                    <span key={w} style={{ background: "#FDF9EE", border: "1px solid rgba(58,38,17,.14)", padding: "8px 13px", borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                      {w}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: "#63543A", margin: 0 }}>
                  Rooted cutting, pup or division, anything pest-free off your own shelf. Bring something rare if you want something rare. If they say yes, you two sort out the meet-up.
                </p>
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 12 }}>WHAT ARE YOU OFFERING OFF YOUR SHELF?</div>
                <textarea
                  value={swapOfferText}
                  onChange={(e) => setSwapOfferText(e.target.value)}
                  rows={2}
                  placeholder="e.g. Melanochrysum cutting, Alocasia Frydek pup"
                  style={{ width: "100%", border: "1px solid rgba(58,38,17,.18)", borderRadius: 12, padding: 14, background: "#FDF9EE", outline: "none", fontSize: 14.5, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={sendSwapOffer}
                  disabled={swapSent}
                  style={{ flex: 1, border: 0, background: swapSent ? "#B0C35C" : "#3A2611", color: swapSent ? "#3A2611" : "#FDF9EE", padding: 17, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: swapSent ? "default" : "pointer" }}
                >
                  {swapSent ? "✓ Offer sent to " + seller.first_name : "Send trade offer"}
                </button>
                <button onClick={goChat} style={{ border: "1.5px solid #6A9331", background: "none", padding: "17px 22px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Message
                </button>
              </div>
            </div>
          ) : null}

          {mode === "rent" ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 27, letterSpacing: "-.02em" }}>{money(listing.price)}</span>
                <span style={{ color: "#7A6A4E", fontSize: 14 }}>per day · delivered &amp; collected</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 11 }}>HOW LONG?</div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  [1, "1 day"],
                  [2, "Weekend"],
                  [3, "3 days"],
                  [7, "A week"],
                ].map(([d, label]) => (
                  <button
                    key={d}
                    onClick={() => setRentTerm(+d)}
                    style={{
                      border: "1.5px solid " + (rentTerm === d ? "#EFB53F" : "rgba(58,38,17,.18)"),
                      background: rentTerm === d ? "#FBEFD8" : "transparent",
                      color: "#3A2611",
                      padding: "13px 18px",
                      borderRadius: 12,
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div data-r="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 9 }}>DELIVERY DATE</div>
                  <input type="date" value={rentDate} onChange={(e) => setRentDate(e.target.value)} style={{ width: "100%", border: "1px solid rgba(58,38,17,.18)", borderRadius: 12, padding: 13, background: "#FDF9EE", outline: "none", fontSize: 14 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 9 }}>DROP TO</div>
                  <select value={rentRegion} onChange={(e) => setRentRegion(e.target.value)} style={{ width: "100%", border: "1px solid rgba(58,38,17,.18)", borderRadius: 12, padding: 13, background: "#FDF9EE", outline: "none", fontSize: 14 }}>
                    {["Port of Spain", "San Fernando", "Chaguanas", "Arima", "Diego Martin", "Tobago"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 16, padding: 18, marginBottom: 14 }}>
                {rentLines.map((l) => (
                  <div key={l.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "7px 0", fontSize: 14, color: "#63543A" }}>
                    <span>{l.label}</span>
                    <span>{l.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "7px 0", fontSize: 14, color: "#3A2611", fontWeight: 700, borderTop: "1px solid rgba(58,38,17,.14)" }}>
                  <span>Total on card today</span>
                  <span>{money(rentTotal)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={sendRentRequest}
                  disabled={rentSent}
                  style={{ flex: 1, border: 0, background: rentSent ? "#B0C35C" : "#EFB53F", color: "#3A2611", padding: 17, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: rentSent ? "default" : "pointer" }}
                >
                  {rentSent ? "✓ Dates requested" : "Request these dates"}
                </button>
                <button onClick={goChat} style={{ border: "1.5px solid #6A9331", background: "none", padding: "17px 22px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Message
                </button>
              </div>
              <div style={{ color: "#7A6A4E", fontSize: 12.5, lineHeight: 1.5, marginTop: 11 }}>Refundable deposit held via WiPay. Driver calls the morning of delivery.</div>
            </div>
          ) : null}

          <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 16, padding: 18, marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
              <img src={seller.avatar_url || "/img/carry.png"} alt={seller.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 7 }}>
                  {seller.name}
                  <span style={{ background: "#B0C35C", color: "#3A2611", fontSize: 9.5, fontWeight: 700, padding: "3px 7px", borderRadius: 999, letterSpacing: ".08em" }}>VERIFIED</span>
                </div>
                <div style={{ color: "#7A6A4E", fontSize: 12.5, marginTop: 3 }}>
                  ★ {seller.rating?.toFixed(1) ?? "5.0"} · {seller.region}
                </div>
              </div>
              <Link href={"/seller/" + seller.id} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "10px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                See their {sellerCount} plants
              </Link>
            </div>
          </div>
          <div style={{ background: "#F5EEDC", borderRadius: 14, padding: 16, marginTop: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 10 }}>{payTitle}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {payMethods.map((pm) => (
                <span key={pm} style={{ background: "#FDF9EE", border: "1px solid rgba(58,38,17,.14)", padding: "8px 13px", borderRadius: 8, fontSize: 12.5 }}>
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length ? (
        <div style={{ marginTop: 70 }}>
          <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 20, letterSpacing: "-.02em", margin: "0 0 20px" }}>More like this</h2>
          <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 22 }}>
            {related.map((r) => (
              <PlantCard key={r.id} vm={buildCardVM(r, [], saved.has(r.id), now)} large={false} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
