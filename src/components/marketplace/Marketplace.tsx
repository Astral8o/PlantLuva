"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithSeller } from "@/lib/types";
import { MODES, REGIONS, SIZES, CARE_LEVELS, type Mode } from "@/lib/constants";
import { money } from "@/lib/format";
import { buildCardVM, highBid } from "@/lib/listingHelpers";
import { PlantCard } from "@/components/PlantCard";
import { useAuth } from "@/components/AuthProvider";
import { useSaved } from "@/components/ListStateProvider";

const PAGE_SIZE = 12;
const MODE_TABS: [string, string][] = [
  ["all", "Everything"],
  ["sale", "For sale"],
  ["bid", "Bidding"],
  ["swap", "Swap"],
  ["rent", "Rent"],
];
const SORTS: [string, string][] = [
  ["new", "Newest"],
  ["low", "Price ↑"],
  ["high", "Price ↓"],
];

export function Marketplace() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requireAuth } = useAuth();
  const saved = useSaved();

  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [bidsByListing, setBidsByListing] = useState<Record<string, { amount: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [modeTab, setModeTab] = useState(searchParams.get("mode") ?? "all");
  const [regions, setRegions] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [care, setCare] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(4000);
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m) setModeTab(m);
  }, [searchParams]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [filtersOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: listingRows } = await supabase
        .from("listings")
        .select("*, seller:profiles(*)")
        .eq("status", "live")
        .order("created_at", { ascending: false });
      const rows = (listingRows as unknown as ListingWithSeller[]) || [];
      if (cancelled) return;
      setListings(rows);
      const ids = rows.map((r) => r.id);
      if (ids.length) {
        const { data: bidRows } = await supabase.from("bids").select("listing_id, amount").in("listing_id", ids);
        const grouped: Record<string, { amount: number }[]> = {};
        for (const b of bidRows || []) {
          (grouped[b.listing_id] ||= []).push({ amount: b.amount });
        }
        if (!cancelled) setBidsByListing(grouped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = listings.filter((l) => {
      if (modeTab !== "all" && l.mode !== modeTab) return false;
      if (q && !(l.name + " " + (l.latin_name || "")).toLowerCase().includes(q)) return false;
      if (regions.length && !regions.includes(l.region)) return false;
      if (sizes.length && !sizes.includes(l.size || "")) return false;
      if (care.length && !care.includes(l.care || "")) return false;
      const p = l.mode === "bid" ? highBid(l, bidsByListing[l.id] || []) : l.price || 0;
      if (l.mode !== "swap" && p > maxPrice) return false;
      return true;
    });
    if (sort === "low")
      out = out.slice().sort((a, b) => (a.price || highBid(a, bidsByListing[a.id] || [])) - (b.price || highBid(b, bidsByListing[b.id] || [])));
    if (sort === "high")
      out = out.slice().sort((a, b) => (b.price || highBid(b, bidsByListing[b.id] || [])) - (a.price || highBid(a, bidsByListing[a.id] || [])));
    return out;
  }, [listings, modeTab, query, regions, sizes, care, maxPrice, sort, bidsByListing]);

  useEffect(() => setPage(1), [modeTab, query, regions, sizes, care, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const visible = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  function countFor(k: string) {
    return k === "all" ? listings.length : listings.filter((l) => l.mode === k).length;
  }
  function toggleIn(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }
  function clearFilters() {
    setRegions([]);
    setSizes([]);
    setCare([]);
    setMaxPrice(4000);
    setQuery("");
    setModeTab("all");
    router.replace("/");
  }

  const activeFilterCount = regions.length + sizes.length + care.length + (maxPrice < 4000 ? 1 : 0);

  const filterGroups: { label: string; options: { label: string; count: number; on: boolean; toggle: () => void }[] }[] = [
    {
      label: "REGION",
      options: REGIONS.map((r) => ({
        label: r,
        count: listings.filter((l) => l.region === r).length,
        on: regions.includes(r),
        toggle: () => toggleIn(regions, setRegions, r),
      })),
    },
    {
      label: "SIZE",
      options: SIZES.map((sVal) => ({
        label: sVal,
        count: listings.filter((l) => l.size === sVal).length,
        on: sizes.includes(sVal),
        toggle: () => toggleIn(sizes, setSizes, sVal),
      })),
    },
    {
      label: "CARE LEVEL",
      options: CARE_LEVELS.map((cVal) => ({
        label: cVal,
        count: listings.filter((l) => l.care === cVal).length,
        on: care.includes(cVal),
        toggle: () => toggleIn(care, setCare, cVal),
      })),
    },
  ];

  const marketTitle =
    modeTab === "all"
      ? "Plants for sale, bid, swap & rent"
      : modeTab === "sale"
      ? "Plants for sale"
      : modeTab === "bid"
      ? "Live bidding"
      : modeTab === "swap"
      ? "Open for swaps"
      : "Plants for rent";

  return (
    <div>
      <section data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 32px 0" }}>
        <div
          data-r="hero"
          style={{
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            background: "#F5A644",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ padding: "22px 28px" }}>
            <p style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 23, lineHeight: 1.1, letterSpacing: "-.02em", margin: 0, color: "#3A2611" }}>
              Sell it. Bid it. Swap it. Rent it.
            </p>
            <p style={{ color: "rgba(58,38,17,.78)", fontSize: 13.5, lineHeight: 1.45, margin: "6px 0 0" }}>
              Every plant says how it moves: fixed price, open bid, up for trade, or out on rent. <span style={{ color: "#3A2611", fontWeight: 700 }}>Swaps are free.</span>
            </p>
          </div>
          <div data-r="heroBtns" style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 28px 22px 0", flexShrink: 0 }}>
            <Link
              href="/sell"
              onClick={(e) => {
                e.preventDefault();
                requireAuth("up", { seller: true, onSuccess: () => router.push("/sell") });
              }}
              style={{ border: 0, background: "#3A2611", color: "#FDF9EE", padding: "11px 20px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Post a plant
            </Link>
          </div>
        </div>
      </section>

      <div style={{ background: "#F5EEDC", borderBottom: "1px solid rgba(58,38,17,.14)", marginTop: 20 }}>
        <div data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "26px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 30, letterSpacing: "-.032em", margin: 0, lineHeight: 1 }}>{marketTitle}</h1>
              <p style={{ color: "#7A6A4E", fontSize: 15, margin: "9px 0 0" }}>{filtered.length} plants · Trinidad &amp; Tobago · prices in TTD</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 3, flexWrap: "wrap" }}>
              <button
                onClick={() => setFiltersOpen(true)}
                className="pl-filters-toggle"
                style={{
                  border: "1px solid " + (activeFilterCount ? "#3A2611" : "rgba(58,38,17,.2)"),
                  background: activeFilterCount ? "#3A2611" : "transparent",
                  color: activeFilterCount ? "#FDF9EE" : "#3A2611",
                  padding: "12px 16px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "none",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Filters{activeFilterCount ? " (" + activeFilterCount + ")" : ""}
              </button>
              <span style={{ color: "#7A6A4E", fontSize: 12.5 }}>Sort</span>
              {SORTS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  style={{
                    border: "1px solid " + (sort === k ? "#3A2611" : "rgba(58,38,17,.2)"),
                    background: sort === k ? "#3A2611" : "transparent",
                    color: sort === k ? "#FDF9EE" : "#63543A",
                    padding: "12px 16px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="pl-tabs" style={{ display: "flex", gap: 26, marginTop: 24, overflowX: "auto" }}>
            {MODE_TABS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setModeTab(k)}
                style={{
                  border: 0,
                  borderBottom: "3px solid " + (modeTab === k ? "#3A2611" : "transparent"),
                  background: "none",
                  color: modeTab === k ? "#3A2611" : "#7A6A4E",
                  padding: "11px 2px 13px",
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  flex: "0 0 auto",
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: k === "all" ? "#A79B7E" : MODES[k as Mode].dot }} />
                {label}
                <span style={{ color: "#6F6249", fontWeight: 500, fontSize: 12.5 }}>{countFor(k)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="pl-filters-backdrop" onClick={() => setFiltersOpen(false)} style={{ display: "none" }} />
      ) : null}
      <div id="pl-main" data-r="shop pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 90px", display: "grid", gridTemplateColumns: "230px 1fr", gap: 40, alignItems: "start" }}>
        <aside className={filtersOpen ? "pl-filters-panel pl-filters-open" : "pl-filters-panel"} style={{ position: "sticky", top: 106 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 16, letterSpacing: ".03em", margin: 0 }}>FILTERS</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={clearFilters} style={{ border: 0, background: "none", color: "#A15A05", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "8px 6px", margin: "-8px 0", minHeight: 28 }}>
                CLEAR ✕
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="pl-filters-close"
                aria-label="Close filters"
                style={{ display: "none", border: 0, background: "none", color: "#3A2611", fontSize: 20, cursor: "pointer", padding: "8px 6px", margin: "-8px -6px 0 0", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          </div>
          {filterGroups.map((g) => (
            <div key={g.label} style={{ borderTop: "1px solid rgba(58,38,17,.14)", padding: "15px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 12 }}>{g.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {g.options.map((o) => (
                  <label key={o.label} onClick={o.toggle} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13.5, color: "#63543A" }}>
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 4,
                        border: "1.5px solid " + (o.on ? "#6A9331" : "rgba(58,38,17,.35)"),
                        background: o.on ? "#6A9331" : "transparent",
                        color: "#F5EEDC",
                        fontSize: 10,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {o.on ? "✓" : ""}
                    </span>
                    {o.label}
                    <span style={{ marginLeft: "auto", color: "#6F6249", fontSize: 11.5 }}>{o.count}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(58,38,17,.14)", padding: "15px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 14 }}>PRICE (TTD)</div>
            <input
              type="range"
              min={0}
              max={4000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              aria-label="Maximum price in Trinidad and Tobago dollars"
              aria-valuetext={money(maxPrice)}
              style={{ width: "100%", height: 32 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#7A6A4E", fontSize: 12, marginTop: 8 }}>
              <span>$0</span>
              <span style={{ fontWeight: 700, color: "#3A2611" }}>to {money(maxPrice)}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(58,38,17,.14)", padding: "16px 0 0" }}>
            <div style={{ background: "#DCE3BC", borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Got a shelf full?</div>
              <p style={{ fontSize: 13, lineHeight: 1.45, color: "#63543A", margin: "0 0 12px" }}>Sell it, put it up for bid, offer a swap, or rent it out for events.</p>
              <button
                onClick={() => requireAuth("up", { seller: true, onSuccess: () => router.push("/sell") })}
                style={{ border: 0, background: "#3A2611", color: "#FDF9EE", padding: "10px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                Post a plant
              </button>
            </div>
          </div>
          <button
            onClick={() => setFiltersOpen(false)}
            className="pl-filters-apply"
            style={{
              display: "none",
              border: 0,
              background: "#6A9331",
              color: "#F5EEDC",
              padding: 16,
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Show {filtered.length} plant{filtered.length === 1 ? "" : "s"}
          </button>
        </aside>

        <div>
          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: "#7A6A4E" }}>Loading the shelf…</div>
          ) : (
            <>
              <div data-r="gauto" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 26 }}>
                {visible.map((l) => (
                  <PlantCard key={l.id} vm={buildCardVM(l, bidsByListing[l.id] || [], saved.has(l.id), now)} />
                ))}
              </div>
              {filtered.length > PAGE_SIZE ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "46px 0 4px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => curPage > 1 && setPage(curPage - 1)}
                    aria-label="Previous page"
                    style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", color: "#3A2611", width: 38, height: 38, borderRadius: "50%", fontSize: 15, cursor: "pointer", opacity: curPage <= 1 ? 0.35 : 1 }}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-label={"Page " + n}
                      aria-current={curPage === n ? "page" : undefined}
                      style={{
                        border: "1px solid " + (curPage === n ? "#3A2611" : "rgba(58,38,17,.2)"),
                        background: curPage === n ? "#3A2611" : "transparent",
                        color: curPage === n ? "#FDF9EE" : "#63543A",
                        minWidth: 38,
                        height: 38,
                        borderRadius: 19,
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "0 12px",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => curPage < totalPages && setPage(curPage + 1)}
                    aria-label="Next page"
                    style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", color: "#3A2611", width: 38, height: 38, borderRadius: "50%", fontSize: 15, cursor: "pointer", opacity: curPage >= totalPages ? 0.35 : 1 }}
                  >
                    →
                  </button>
                  <span style={{ marginLeft: 10, color: "#6F6249", fontSize: 12.5 }}>
                    Page {curPage} of {totalPages}
                  </span>
                </div>
              ) : null}
              {filtered.length === 0 ? (
                <div style={{ padding: "80px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19 }}>Nothing matching that</div>
                  <p style={{ fontSize: 14.5, color: "#7A6A4E", margin: "10px 0 20px" }}>Loosen a filter and try again.</p>
                  <button onClick={clearFilters} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "12px 22px", borderRadius: 999, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                    Clear filters
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
