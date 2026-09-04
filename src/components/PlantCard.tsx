"use client";

import Link from "next/link";
import type { CardVM } from "@/lib/listingHelpers";
import { useSaved } from "@/components/ListStateProvider";
import { useToast } from "@/components/ToastProvider";

export function PlantCard({ vm, large = true }: { vm: CardVM; large?: boolean }) {
  const saved = useSaved();
  const flash = useToast();
  const favored = saved.has(vm.id);

  return (
    <div className="pl-rise" style={{ cursor: "pointer" }}>
      <Link href={vm.href} style={{ color: "inherit", textDecoration: "none" }}>
        <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: large ? 18 : 16, background: "#EBE2CE" }}>
          <img
            src={vm.img}
            alt={vm.name}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: vm.badgeBg,
              color: vm.badgeFg,
              padding: "5px 11px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".1em",
            }}
          >
            {vm.badge}
          </span>
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saved.toggle(vm.id);
                flash(favored ? "Removed from saved" : "Saved to your list");
              }}
              aria-label={(favored ? "Remove " : "Save ") + vm.name + (favored ? " from your saved list" : " to your saved list")}
              title="Save"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: 0,
                background: "rgba(253,249,238,.92)",
                cursor: "pointer",
                fontSize: 15,
                color: vm.favColor,
                display: "grid",
                placeItems: "center",
              }}
            >
              {vm.favIcon}
            </button>
            {large ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof window !== "undefined") {
                    navigator.clipboard?.writeText(window.location.origin + vm.href).catch(() => {});
                  }
                  flash("Link copied, paste it in your WhatsApp status");
                }}
                aria-label={"Share " + vm.name}
                title="Share"
                style={{ width: 34, height: 34, borderRadius: "50%", border: 0, background: "rgba(253,249,238,.92)", cursor: "pointer", fontSize: 13, display: "grid", placeItems: "center" }}
              >
                ↗
              </button>
            ) : null}
          </div>
          {vm.isBid ? (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(to top,rgba(58,38,17,.88),transparent)",
                padding: "22px 13px 11px",
                color: "#FDF9EE",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{vm.bidCount} bids</span>
              <span style={{ color: "#FFD9A6", fontWeight: 700 }}>{vm.countdown}</span>
            </div>
          ) : null}
        </div>
        <div style={{ padding: large ? "15px 2px 0" : "12px 2px 0" }}>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: large ? 600 : 600, fontSize: large ? 17.5 : 16, lineHeight: 1.2 }}>{vm.name}</div>
          {large ? <div style={{ color: "#6F6249", fontSize: 13.5, fontStyle: "italic", marginTop: 3, overflowWrap: "anywhere" }}>{vm.latin}</div> : null}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: large ? 11 : 8, gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: large ? 17 : 15, color: vm.priceColor }}>{vm.priceLabel}</span>
            <span style={{ color: "#7A6A4E", fontSize: large ? 12.5 : 12 }}>{vm.region}</span>
          </div>
          {large ? <div style={{ color: "#6F6249", fontSize: 12.5, marginTop: 5 }}>{vm.sellerName} · {vm.metaLabel}</div> : null}
        </div>
      </Link>
    </div>
  );
}
