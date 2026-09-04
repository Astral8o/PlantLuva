import Link from "next/link";

export function Footer() {
  return (
    <footer className="pl-dark" style={{ background: "#3A2611", color: "rgba(253,249,238,.72)", marginTop: 0 }}>
      <div
        data-r="pad"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "44px 32px",
          display: "flex",
          gap: 40,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19, color: "#B0C35C" }}>
            Plant<span style={{ color: "#F2C438" }}>♥</span>Luva
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: "10px 0 0", maxWidth: 330 }}>
            The plant marketplace for Trinidad &amp; Tobago. Sell, bid, swap or rent. One shelf, whole island.
          </p>
        </div>
        <div style={{ display: "flex", gap: 44, flexWrap: "wrap", fontSize: 14 }}>
          <div style={{ display: "grid", gap: 9 }}>
            <span style={{ color: "#C9BFA6", fontSize: 11, fontWeight: 700, letterSpacing: ".12em" }}>MARKET</span>
            <Link href="/?mode=sale">For sale</Link>
            <Link href="/?mode=bid">Auctions</Link>
            <Link href="/?mode=swap">Swaps</Link>
            <Link href="/?mode=rent">Rentals</Link>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <span style={{ color: "#C9BFA6", fontSize: 11, fontWeight: 700, letterSpacing: ".12em" }}>SELLERS</span>
            <Link href="/sell">Post a plant</Link>
            <Link href="/dashboard">Payouts &amp; WiPay</Link>
            <Link href="/about">Seller rules</Link>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <span style={{ color: "#C9BFA6", fontSize: 11, fontWeight: 700, letterSpacing: ".12em" }}>HELP</span>
            <Link href="/about">Delivery &amp; pickup</Link>
            <Link href="/about">Plant health</Link>
            <a href="https://wa.me/18680000000" target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(253,249,238,.14)", padding: "16px 32px", fontSize: 12.5, maxWidth: 1400, margin: "0 auto" }}>
        © 2026 PlantLuva · Port of Spain
      </div>
    </footer>
  );
}
