import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ListingWithSeller } from "@/lib/types";
import { buildCardVM } from "@/lib/listingHelpers";
import { PlantCard } from "@/components/PlantCard";
import { SellerChatButton } from "@/components/detail/SellerChatButton";
import { DEMO_MODE } from "@/lib/demoMode";
import { MOCK_LISTINGS, MOCK_SELLERS } from "@/lib/mockData";
import type { Profile } from "@/lib/types";

export default async function SellerPage(props: PageProps<"/seller/[id]">) {
  const { id } = await props.params;

  let seller: Profile | null;
  let listings: ListingWithSeller[];
  let swapCount = 0;

  if (DEMO_MODE) {
    seller = Object.values(MOCK_SELLERS).find((s) => s.id === id) || null;
    if (!seller) notFound();
    listings = MOCK_LISTINGS.filter((l) => l.seller_id === id);
  } else {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    seller = data;
    if (!seller) notFound();

    const { data: listingRows } = await supabase
      .from("listings")
      .select("*, seller:profiles(*)")
      .eq("seller_id", id)
      .eq("status", "live")
      .order("created_at", { ascending: false });
    listings = (listingRows as unknown as ListingWithSeller[]) || [];

    const { count } = await supabase
      .from("swap_offers")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .in("listing_id", listings.map((l) => l.id).length ? listings.map((l) => l.id) : ["00000000-0000-0000-0000-000000000000"]);
    swapCount = count || 0;
  }

  const stats = [
    { n: String(listings.length), label: "plants listed" },
    { n: (seller.rating ?? 5).toFixed(1), label: "seller rating" },
    { n: String(listings.length), label: "active listings" },
    { n: String(swapCount || 0), label: "swaps completed" },
  ];

  return (
    <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 90px" }}>
      <Link href="/" style={{ border: 0, background: "none", color: "#7A6A4E", fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", padding: 0, marginBottom: 20, display: "inline-block" }}>
        ← BACK
      </Link>
      <div style={{ background: "#F5EEDC", borderRadius: 22, padding: 32, display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
        <img src={seller.avatar_url || "/img/potting-shop.jpg"} alt={seller.name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", margin: 0, display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
            {seller.name}
            <span style={{ background: "#B0C35C", color: "#3A2611", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 999, letterSpacing: ".09em" }}>VERIFIED GROWER</span>
          </h1>
          <div style={{ color: "#7A6A4E", fontSize: 14.5, marginTop: 7 }}>
            ★ {(seller.rating ?? 5).toFixed(1)} · {seller.region}
          </div>
          <p style={{ color: "#63543A", fontSize: 15, lineHeight: 1.55, margin: "12px 0 0", maxWidth: 620 }}>{seller.bio}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SellerChatButton sellerId={seller.id} firstName={seller.first_name} />
        </div>
      </div>
      <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 20, margin: "30px 0 34px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ borderTop: "2px solid #3A2611", paddingTop: 15 }}>
            <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 24, letterSpacing: "-.03em", lineHeight: 1 }}>{s.n}</div>
            <div style={{ color: "#7A6A4E", fontSize: 13, marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19, letterSpacing: "-.02em", margin: "0 0 18px" }}>{seller.first_name}&apos;s plants</h2>
      <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 22 }}>
        {listings.map((l) => (
          <PlantCard key={l.id} vm={buildCardVM(l, [], false, Date.now())} large={false} />
        ))}
      </div>
      {listings.length === 0 ? <p style={{ color: "#7A6A4E" }}>Nothing on the shelf right now.</p> : null}
    </main>
  );
}
