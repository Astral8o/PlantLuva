import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ListingWithSeller } from "@/lib/types";
import { buildCardVM } from "@/lib/listingHelpers";
import { PlantCard } from "@/components/PlantCard";
import { MODES, type Mode } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_LISTINGS } from "@/lib/mockData";

export const metadata = {
  title: "About | PlantLuva",
};

const MODE_CARDS: [Mode, string, string, string][] = [
  ["sale", "Buy it straight", "Fixed price, message the grower, collect or courier.", "#F5EEDC"],
  ["bid", "Bid on the rare ones", "Thursday-night auctions on collector aroids and variegates.", "#FDF9EE"],
  ["swap", "Cutting for cutting", "Add plants to your wishlist and trade off your own shelf to get them.", "#DCE3BC"],
  ["rent", "Rent for the day", "Statement plants for weddings, shoots and launches.", "#FBEFD8"],
];

export default async function AboutPage() {
  let listings: ListingWithSeller[];
  let counts: Record<string, number> = {};
  if (DEMO_MODE) {
    listings = MOCK_LISTINGS.slice(0, 4);
    for (const l of MOCK_LISTINGS) counts[l.mode] = (counts[l.mode] || 0) + 1;
  } else {
    const supabase = await createClient();
    const { data: listingRows } = await supabase
      .from("listings")
      .select("*, seller:profiles(*)")
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(4);
    listings = (listingRows as unknown as ListingWithSeller[]) || [];

    const { data: allLive } = await supabase.from("listings").select("mode").eq("status", "live");
    for (const l of allLive || []) counts[l.mode] = (counts[l.mode] || 0) + 1;
  }

  return (
    <div>
      <section style={{ background: "#F5EEDC", borderBottom: "1px solid rgba(58,38,17,.12)" }}>
        <div data-r="split pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "58px 32px 0", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ paddingBottom: 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#DCE3BC", border: "1px solid #B0C35C", color: "#63543A", padding: "8px 15px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: ".1em", marginBottom: 24 }}>
              <span style={{ color: "#F2C438" }}>♥</span>TRINIDAD &amp; TOBAGO
            </div>
            <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 44, lineHeight: 1.04, letterSpacing: "-.02em", margin: 0, color: "#3A2611", maxWidth: "15ch" }}>
              Sell it. Bid it. Swap it. Rent it.
            </h1>
            <p style={{ color: "#63543A", fontSize: 16.5, lineHeight: 1.6, maxWidth: 470, margin: "18px 0 28px" }}>
              One marketplace for plant luvas across both islands. Every plant on the shelf says how it&apos;s going, straight sale, live bid, open swap, or rented for the weekend.
            </p>
            <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
              <Link href="/" style={{ border: 0, background: "#6A9331", color: "#FDF9EE", padding: "14px 26px", borderRadius: 999, fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Browse the shelf
              </Link>
              <Link href="/sell" style={{ border: "1.5px solid #6A9331", background: "none", color: "#3A2611", padding: "14px 26px", borderRadius: 999, fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Post a plant
              </Link>
            </div>
            <div style={{ display: "flex", gap: 36, marginTop: 40, flexWrap: "wrap" }}>
              {[
                { n: "214", label: "plants on the shelf" },
                { n: "86", label: "growers, both islands" },
                { n: "41", label: "swaps done this month" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 24, color: "#6A9331", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ color: "#7A6A4E", fontSize: 13, marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", alignSelf: "end" }}>
            <div style={{ borderRadius: "26px 26px 0 0", overflow: "hidden", aspectRatio: "4/5", background: "#EBE2CE" }}>
              <img src="/img/pink-princess.jpg" alt="Plant collection" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", left: -24, bottom: 70, background: "#FDF9EE", borderRadius: 18, padding: "16px 20px", boxShadow: "0 12px 30px rgba(58,38,17,.16)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", color: "#6F6249" }}>LIVE BID</div>
              <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 19, marginTop: 5 }}>TT$2,900</div>
              <div style={{ color: "#A15A05", fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>Monstera Albo · 41m left</div>
            </div>
          </div>
        </div>
      </section>

      <section data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "68px 32px 0" }}>
        <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 28, letterSpacing: "-.02em", margin: "0 0 8px" }}>Four ways a plant moves</h2>
        <p style={{ color: "#7A6A4E", fontSize: 16, margin: "0 0 26px" }}>Pick a tag and the whole shelf filters to it.</p>
        <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 18 }}>
          {MODE_CARDS.map(([k, title, text, bg]) => (
            <Link
              key={k}
              href={"/?mode=" + k}
              style={{ display: "block", textAlign: "left", border: "1px solid rgba(58,38,17,.14)", background: bg, borderRadius: 20, padding: 26, cursor: "pointer", color: "inherit" }}
            >
              <span style={{ display: "inline-block", background: MODES[k].bg, color: MODES[k].fg, padding: "5px 12px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em" }}>
                {MODES[k].badge}
              </span>
              <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 19, margin: "16px 0 8px", color: "#3A2611" }}>{title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#63543A" }}>{text}</div>
              <div style={{ color: "#4F6E24", fontSize: 13.5, fontWeight: 700, marginTop: 16 }}>{counts[k] || 0} plants →</div>
            </Link>
          ))}
        </div>
      </section>

      <section data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "64px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 28, letterSpacing: "-.02em", margin: 0 }}>Fresh on the shelf</h2>
          <Link href="/" style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "12px 20px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            See everything →
          </Link>
        </div>
        <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 22 }}>
          {listings.map((l) => (
            <PlantCard key={l.id} vm={buildCardVM(l, [], false, Date.now())} />
          ))}
        </div>
      </section>

      <section data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "68px 32px 0" }}>
        <div data-r="split cushion" className="pl-dark" style={{ background: "#3A2611", borderRadius: 26, padding: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#B0C35C", marginBottom: 16 }}>FOR GROWERS</div>
            <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 29, lineHeight: 1.05, letterSpacing: "-.02em", color: "#FDF9EE", margin: "0 0 14px" }}>Your shelf, earning</h2>
            <p style={{ color: "rgba(253,249,238,.78)", fontSize: 16, lineHeight: 1.6, margin: "0 0 26px" }}>
              List in three steps and pick how it moves. Money reaches your bank two days after handover, or your WiPay wallet the same evening. Swaps cost nothing, ever.
            </p>
            <Link href="/sell" style={{ border: 0, background: "#B0C35C", color: "#3A2611", padding: "16px 28px", borderRadius: 999, fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Post your first plant
            </Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { n: "1", title: "Snap and describe it", text: "Photos, name, where you are, a line about how it grows." },
              { n: "2", title: "Pick how it moves", text: "Sale price, opening bid, what you want in trade, or a day rate." },
              { n: "3", title: "Hand it over, get paid", text: "WiPay, bank transfer or cash at pickup. Your choice per deal." },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(253,249,238,.07)", border: "1px solid rgba(253,249,238,.13)", borderRadius: 16, padding: 18 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#B0C35C", color: "#3A2611", fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 15, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {s.n}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 18, color: "#FDF9EE" }}>{s.title}</div>
                  <div style={{ color: "rgba(253,249,238,.7)", fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "68px 32px 84px" }}>
        <div data-r="split" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 22 }}>
          <div style={{ background: "#DCE3BC", borderRadius: 26, padding: 40 }}>
            <span style={{ display: "inline-block", background: "#B0C35C", color: "#3A2611", padding: "6px 13px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em" }}>SWAP SHOP</span>
            <h3 style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 24, lineHeight: 1.08, letterSpacing: "-.02em", margin: "16px 0 10px" }}>
              Grow your collection off somebody else&apos;s shelf
            </h3>
            <p style={{ color: "#63543A", fontSize: 15.5, lineHeight: 1.55, margin: "0 0 22px" }}>
              The oldest way plant people grow a collection. Put up what you have spare: pups, divisions, a rooted top cut, list what you&apos;re in search of, and trade.
            </p>
            <Link href="/?mode=swap" style={{ border: 0, background: "#3A2611", color: "#FDF9EE", padding: "14px 24px", borderRadius: 999, fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              See what&apos;s up for trade
            </Link>
          </div>
          <div style={{ position: "relative", borderRadius: 26, overflow: "hidden", minHeight: 320, display: "flex", alignItems: "flex-end" }}>
            <img src="/img/monstera-corner.jpg" alt="Statement plants for rent" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(58,38,17,.9),transparent 68%)" }} />
            <div style={{ position: "relative", padding: 32 }}>
              <span style={{ display: "inline-block", background: "#EFB53F", color: "#3A2611", padding: "6px 13px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em" }}>FOR RENT</span>
              <h3 style={{ fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 22, lineHeight: 1.1, color: "#FDF9EE", margin: "14px 0 8px" }}>Big greenery for one big day</h3>
              <p style={{ color: "rgba(253,249,238,.82)", fontSize: 14.5, lineHeight: 1.5, margin: "0 0 18px", maxWidth: 380 }}>Weddings, shoots, launches, Divali lime. Delivered and collected.</p>
              <Link href="/?mode=rent" style={{ border: 0, background: "#FDF9EE", color: "#3A2611", padding: "13px 22px", borderRadius: 999, fontFamily: "var(--font-gluten)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                See rental stock
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
