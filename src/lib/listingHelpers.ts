import { MODES, type Mode } from "@/lib/constants";
import { money, countdown } from "@/lib/format";
import type { ListingWithSeller } from "@/lib/types";

export interface CardVM {
  id: string;
  name: string;
  latin: string;
  img: string;
  region: string;
  sellerName: string;
  sellerId: string;
  badge: string;
  badgeBg: string;
  badgeFg: string;
  priceLabel: string;
  priceColor: string;
  metaLabel: string;
  isBid: boolean;
  bidCount: number;
  countdown: string;
  favIcon: string;
  favColor: string;
  href: string;
}

export function highBid(listing: ListingWithSeller, bids: { amount: number }[]): number {
  if (!bids.length) return listing.start_bid || 0;
  return Math.max(...bids.map((b) => b.amount));
}

export function priceLabel(listing: ListingWithSeller, bids: { amount: number }[]): string {
  const mode = listing.mode as Mode;
  if (mode === "bid") return money(highBid(listing, bids));
  if (mode === "swap") return "Up for trade";
  if (mode === "rent") return money(listing.price) + "/day";
  return money(listing.price);
}

export function metaLabel(listing: ListingWithSeller, bidCount: number): string {
  const mode = listing.mode as Mode;
  if (mode === "bid") return bidCount + " bids";
  if (mode === "swap") return "ISO " + (listing.wants?.length || 0) + " plants";
  if (mode === "rent") return "delivered";
  return listing.size || "";
}

export function buildCardVM(
  listing: ListingWithSeller,
  bids: { amount: number }[],
  favored: boolean,
  now: number
): CardVM {
  const m = MODES[listing.mode as Mode];
  const bidCount = bids.length;
  return {
    id: listing.id,
    name: listing.name,
    latin: listing.latin_name || "",
    img: listing.images?.[0] || "/img/jungle.png",
    region: listing.region,
    sellerName: listing.seller?.name || "",
    sellerId: listing.seller_id,
    badge: m.badge,
    badgeBg: m.bg,
    badgeFg: m.fg,
    priceLabel: priceLabel(listing, bids),
    priceColor: m.price,
    metaLabel: metaLabel(listing, bidCount),
    isBid: listing.mode === "bid",
    bidCount,
    countdown: listing.mode === "bid" ? countdown(listing.ends_at, now) : "",
    favIcon: favored ? "♥" : "♡",
    favColor: favored ? "#F5A644" : "#3A2611",
    href: "/listing/" + listing.id,
  };
}
