"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { MODES, REGIONS, SIZES, CARE_LEVELS, type Mode } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demoMode";

const MAX_PHOTOS = 5;

interface Draft {
  name: string;
  region: string;
  blurb: string;
  mode: Mode;
  size: string;
  care: string;
  light: string;
  price: string; // asking price / starting bid / day rate
  isoText: string; // swap: what they want
  openToText: string; // swap: also open to
  auctionDays: string; // bid: 1 | 3 | 7
  deposit: string; // rent
  delivery: "self" | "courier";
  photos: string[]; // object URLs of user-picked images, up to MAX_PHOTOS
}

const EMPTY_DRAFT = (region: string): Draft => ({
  name: "",
  region,
  blurb: "",
  mode: "sale",
  size: "Medium",
  care: "Easy",
  light: "Bright indirect",
  price: "",
  isoText: "",
  openToText: "",
  auctionDays: "3",
  deposit: "500",
  delivery: "self",
  photos: [],
});

const FIELD_LABELS: Record<Mode, { title: string; priceLabel: string; pricePh: string }> = {
  sale: { title: "Sale details", priceLabel: "ASKING PRICE (TTD)", pricePh: "850" },
  bid: { title: "Auction details", priceLabel: "STARTING BID (TTD)", pricePh: "600" },
  swap: { title: "Your wishlist", priceLabel: "", pricePh: "" },
  rent: { title: "Rental details", priceLabel: "DAY RATE (TTD)", pricePh: "300" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(58,38,17,.18)",
  borderRadius: 12,
  padding: 13,
  background: "#FDF9EE",
  outline: "none",
  fontSize: 14.5,
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".13em", marginBottom: 9 };

export function SellWizard() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, loading: authLoading, requireAuth } = useAuth();
  const flash = useToast();

  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(false);
  const [batch, setBatch] = useState<Draft[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT("Port of Spain"));
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setDraft((d) => {
      const room = MAX_PHOTOS - d.photos.length;
      const urls = files.slice(0, room).map((f) => URL.createObjectURL(f));
      if (files.length > room) flash("Only " + MAX_PHOTOS + " photos per plant — the rest weren't added");
      return { ...d, photos: [...d.photos, ...urls] };
    });
  }

  function removePhoto(i: number) {
    // Not revoking the object URL here — "Duplicate" can leave two drafts
    // sharing the same blob URL, and revoking would break the other one too.
    setDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }));
  }

  function toRow(d: Draft, uid: string) {
    const mode = d.mode;
    let price: number | null = null;
    let startBid: number | null = null;
    let endsAt: string | null = null;
    let wants: string[] = [];
    let blurb = d.blurb;

    if (mode === "sale") {
      price = +d.price || 0;
    } else if (mode === "bid") {
      startBid = +d.price || 0;
      const days = +d.auctionDays || 3;
      endsAt = new Date(Date.now() + days * 86400000).toISOString();
    } else if (mode === "rent") {
      price = +d.price || 0;
      blurb = blurb + (d.deposit ? " Refundable deposit TT$" + d.deposit + "." : "");
    } else if (mode === "swap") {
      wants = d.isoText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (d.openToText.trim()) blurb = blurb + " Also open to: " + d.openToText.trim() + ".";
    }

    return {
      seller_id: uid,
      name: d.name,
      region: d.region,
      blurb,
      mode,
      size: d.size,
      care: d.care,
      light: d.light,
      price,
      start_bid: startBid,
      ends_at: endsAt,
      wants,
      images: d.photos.length ? d.photos : ["/img/pink-princess.jpg"],
      status: "pending",
    };
  }

  function addAnother(kind: "another" | "duplicate" = "another") {
    if (!draft.name.trim()) return flash("Give this plant a name first");
    const saved = draft;
    setBatch((b) => [...b, saved]);
    setDraft(
      kind === "duplicate"
        ? { ...saved }
        : {
            ...EMPTY_DRAFT(saved.region),
            size: saved.size,
            care: saved.care,
            light: saved.light,
            mode: saved.mode,
            delivery: saved.delivery,
            auctionDays: saved.auctionDays,
            deposit: saved.deposit,
          }
    );
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    flash(kind === "duplicate" ? "Duplicated " + saved.name + " — tweak what's different" : saved.name + " saved. Region, size, care and light carried over for the next one.");
  }

  function editQueued(i: number) {
    const item = batch[i];
    setBatch((b) => {
      const rest = b.filter((_, j) => j !== i);
      return draft.name.trim() ? [...rest, draft] : rest;
    });
    setDraft(item);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function publish() {
    if (!draft.name.trim()) return flash("Give this plant a name first");
    requireAuth("up", {
      seller: true,
      onSuccess: async () => {
        if (DEMO_MODE) {
          setPublished(true);
          window.scrollTo(0, 0);
          flash("Listing sent for review");
          return;
        }
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        setSubmitting(true);
        const rows = [...batch, draft].map((d) => toRow(d, uid));
        const { error } = await supabase.from("listings").insert(rows);
        setSubmitting(false);
        if (error) return flash(error.message);
        setPublished(true);
        window.scrollTo(0, 0);
        flash("Listing sent for review");
      },
    });
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <main data-r="pad" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px 96px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 29, letterSpacing: "-.03em" }}>Post a plant</h1>
        <p style={{ color: "#63543A", margin: "14px 0 24px" }}>You&apos;ll need a PlantLuva account to list here, as an individual seller or a plant shop.</p>
        <button onClick={() => requireAuth("up", { seller: true })} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 28px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Get started
        </button>
      </main>
    );
  }

  if (!profile?.seller_type) {
    return (
      <main data-r="pad" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px 96px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 29, letterSpacing: "-.03em" }}>Post a plant</h1>
        <p style={{ color: "#63543A", margin: "14px 0 24px" }}>Your account is set up for buying so far. Set up a seller profile to list here, as an individual seller or a plant shop.</p>
        <button onClick={() => requireAuth("up", { seller: true })} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 28px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Set up seller profile
        </button>
      </main>
    );
  }

  if (published) {
    const totalCount = batch.length + 1;
    return (
      <main data-r="pad" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px 96px" }}>
        <div className="pl-rise" style={{ textAlign: "center", padding: "50px 0" }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#F5A644", display: "grid", placeItems: "center", fontSize: 26, color: "#3A2611", margin: "0 auto 24px" }}>◷</div>
          <div style={{ display: "inline-block", background: "#DCE3BC", border: "1px solid #B0C35C", color: "#63543A", padding: "7px 15px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", marginBottom: 18 }}>
            IN REVIEW
          </div>
          <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 30, letterSpacing: "-.03em", margin: "0 0 12px" }}>
            {totalCount > 1 ? totalCount + " plants sent for review" : "Sent for review"}
          </h1>
          <p style={{ color: "#63543A", fontSize: 16, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 22px" }}>
            {totalCount > 1 ? totalCount + " listings are submitted, including " + draft.name + "." : draft.name + " is submitted."} We check every listing to make
            sure it is safe and trusted for the buyer: clear photos, pest-free condition, honest pricing. Approval takes up to 24 hours, and you get a message the moment each one goes live on the shelf.
          </p>
          <div style={{ display: "flex", gap: 0, justifyContent: "center", alignItems: "stretch", maxWidth: 540, margin: "0 auto 28px", border: "1px solid rgba(58,38,17,.14)", borderRadius: 16, overflow: "hidden" }}>
            {[
              { tag: "DONE", label: "Listing submitted", bg: "#DCE3BC" },
              { tag: "NOW", label: "Team review, up to 24 hrs", bg: "#F5EEDC" },
              { tag: "NEXT", label: "Live on the shelf", bg: "transparent" },
            ].map((r) => (
              <div key={r.tag} style={{ flex: 1, padding: "16px 14px", background: r.bg, borderLeft: "1px solid rgba(58,38,17,.1)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", color: "#7A6A4E" }}>{r.tag}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#3A2611", marginTop: 5 }}>{r.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => router.push("/dashboard")} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Track it in my dashboard
            </button>
            <button
              onClick={() => {
                setPublished(false);
                setBatch([]);
                setDraft(EMPTY_DRAFT(draft.region));
                setStep(1);
              }}
              style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Post another
            </button>
          </div>
        </div>
      </main>
    );
  }

  const fields = FIELD_LABELS[draft.mode];

  return (
    <main data-r="pad" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 32px 96px" }}>
      <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 29, letterSpacing: "-.03em", margin: "0 0 6px" }}>Post a plant</h1>
      <p style={{ color: "#7A6A4E", fontSize: 13.5, margin: "0 0 6px" }}>
        Selling as {profile?.name || "you"} · {profile?.seller_type === "business" ? "Plant shop" : "Individual seller"}
      </p>
      {!batch.length ? (
        <p style={{ color: "#7A6A4E", fontSize: 13, margin: "0 0 24px" }}>
          Got more than one to list? Save each plant and keep going — you&apos;ll review and submit the whole shelf together at the end.
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#DCE3BC", borderRadius: 14, padding: "12px 16px", marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#3A2611", flexShrink: 0 }}>
            {batch.length} plant{batch.length === 1 ? "" : "s"} queued
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {batch.map((b, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#FDF9EE", borderRadius: 999, padding: "5px 6px 5px 4px", fontSize: 12.5, color: "#3A2611" }}>
                <button
                  onClick={() => editQueued(i)}
                  title="Edit this listing"
                  style={{ border: 0, background: "none", color: "#3A2611", fontSize: 12.5, cursor: "pointer", padding: "2px 8px", font: "inherit" }}
                >
                  {b.name}
                </button>
                <button
                  onClick={() => setBatch((list) => list.filter((_, j) => j !== i))}
                  title="Remove"
                  style={{ border: 0, background: "none", color: "#7A6A4E", fontSize: 14, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {step !== 3 ? (
            <button onClick={() => setStep(3)} style={{ border: 0, background: "none", color: "#4F6E24", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
              Review &amp; submit all →
            </button>
          ) : null}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
        {[
          [1, "DETAILS"],
          [2, "HOW TO LIST"],
          [3, "REVIEW"],
        ].map(([n, label]) => (
          <div key={n} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: step >= +n ? "#6A9331" : "rgba(58,38,17,.15)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: step >= +n ? "#3A2611" : "#A79B7E", marginTop: 9 }}>{label}</div>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="pl-rise" style={{ display: "grid", gap: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={labelStyle}>PHOTOS · UP TO 5</div>
            <div style={{ overflowX: "auto", paddingBottom: 2, minWidth: 0 }}>
              <div data-r="photog" style={{ display: "grid", gridTemplateColumns: `repeat(${MAX_PHOTOS},72px)`, gridAutoRows: 72, gap: 10, width: "max-content" }}>
                {Array.from({ length: MAX_PHOTOS }).map((_, i) =>
                  draft.photos[i] ? (
                    <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 14, overflow: "hidden" }}>
                      <img src={draft.photos[i]} alt={"Photo " + (i + 1)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                        style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", border: 0, background: "rgba(58,38,17,.75)", color: "#FDF9EE", fontSize: 12, lineHeight: 1, cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: 72, height: 72, border: "1.5px dashed rgba(58,38,17,.3)", borderRadius: 14, display: "grid", placeItems: "center", color: "#A79B7E", fontSize: 22, background: "none", cursor: "pointer", padding: 0 }}
                    >
                      +
                    </button>
                  )
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoFiles} style={{ display: "none" }} />
            <p style={{ color: "#7A6A4E", fontSize: 12.5, margin: "9px 0 0" }}>
              {draft.photos.length ? "Tap the × to remove a photo. First photo is the cover." : "Tap a square to add photos from your device. First photo becomes the cover."}
            </p>
          </div>
          <div data-r="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={labelStyle}>PLANT NAME</div>
              <input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Philodendron Gloriosum" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>WHERE YOU ARE</div>
              <select value={draft.region} onChange={(e) => set("region", e.target.value)} style={inputStyle}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div data-r="g3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <div style={labelStyle}>SIZE</div>
              <select value={draft.size} onChange={(e) => set("size", e.target.value)} style={inputStyle}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>CARE LEVEL</div>
              <select value={draft.care} onChange={(e) => set("care", e.target.value)} style={inputStyle}>
                {CARE_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>LIGHT</div>
              <input value={draft.light} onChange={(e) => set("light", e.target.value)} placeholder="Bright indirect" style={inputStyle} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>TELL PEOPLE ABOUT IT</div>
            <textarea
              value={draft.blurb}
              onChange={(e) => set("blurb", e.target.value)}
              rows={3}
              placeholder="Mother plant, three years in the same pot, new leaf every six weeks…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => addAnother()}
              style={{ border: "1.5px solid #6A9331", background: "none", color: "#3A2611", padding: "15px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              + Save &amp; add another plant
            </button>
            <button
              onClick={() => (draft.name.trim() ? setStep(2) : flash("Give this plant a name first"))}
              style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 30px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Next: how to list it →
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="pl-rise" style={{ display: "grid", gap: 20 }}>
          <div>
            <div style={labelStyle}>SELL, BID, SWAP OR RENT?</div>
            <div data-r="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
              {(["sale", "bid", "swap", "rent"] as Mode[]).map((k) => (
                <button
                  key={k}
                  onClick={() => set("mode", k)}
                  style={{
                    border: "2px solid " + (draft.mode === k ? MODES[k].dot : "rgba(58,38,17,.14)"),
                    background: draft.mode === k ? "#F5EEDC" : "transparent",
                    padding: "18px 14px",
                    borderRadius: 16,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 9 }}>{{ sale: "$", bid: "↑", swap: "⇄", rent: "◷" }[k]}</div>
                  <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 15 }}>{{ sale: "Sell", bid: "Bid", swap: "Swap", rent: "Rent" }[k]}</div>
                  <div style={{ color: "#7A6A4E", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                    {{ sale: "Fixed price, straight sale", bid: "Highest offer wins", swap: "Cutting for cutting", rent: "By the day for events" }[k]}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: "#F5EEDC", borderRadius: 16, padding: 22, display: "grid", gap: 16 }}>
            <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 17 }}>{fields.title}</div>
            {draft.mode === "swap" ? (
              <div data-r="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={labelStyle}>ISO / IN SEARCH OF (comma separated)</div>
                  <input value={draft.isoText} onChange={(e) => set("isoText", e.target.value)} placeholder="Anthurium Clarinervium, Philodendron Verrucosum" style={inputStyle} />
                </div>
                <div>
                  <div style={labelStyle}>ALSO OPEN TO</div>
                  <input value={draft.openToText} onChange={(e) => set("openToText", e.target.value)} placeholder="Any variegated aroid" style={inputStyle} />
                </div>
              </div>
            ) : (
              <div data-r="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={labelStyle}>{fields.priceLabel}</div>
                  <input value={draft.price} onChange={(e) => set("price", e.target.value)} placeholder={fields.pricePh} style={inputStyle} />
                </div>
                {draft.mode === "bid" ? (
                  <div>
                    <div style={labelStyle}>CLOSES IN</div>
                    <select value={draft.auctionDays} onChange={(e) => set("auctionDays", e.target.value)} style={inputStyle}>
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                    </select>
                  </div>
                ) : draft.mode === "rent" ? (
                  <div>
                    <div style={labelStyle}>DEPOSIT (TTD)</div>
                    <input value={draft.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="500" style={inputStyle} />
                  </div>
                ) : (
                  <div />
                )}
              </div>
            )}
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>{draft.mode === "swap" ? "HOW WILL YOU HAND OVER?" : "ACCEPT PAYMENT BY"}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(draft.mode === "swap" ? ["Meet up in person", "Labelled & pest-free", "Rooted or unrooted"] : ["WiPay card", "Bank transfer", "Cash on pickup", "Rental deposit"]).map((p) => (
                  <span key={p} style={{ border: "1.5px solid rgba(58,38,17,.18)", padding: "10px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: "#63543A" }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {draft.mode !== "swap" ? (
              <div>
                <div style={{ ...labelStyle, marginBottom: 10 }}>HOW WILL YOU DELIVER?</div>
                <div data-r="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {(["self", "courier"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("delivery", d)}
                      style={{
                        border: "2px solid " + (draft.delivery === d ? "#6A9331" : "rgba(58,38,17,.14)"),
                        background: draft.delivery === d ? "#FDF9EE" : "transparent",
                        borderRadius: 14,
                        padding: "14px 15px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 14 }}>
                        {d === "self" ? "I'll deliver / meet up" : "PlantLuva courier"}
                      </div>
                      <div style={{ color: "#7A6A4E", fontSize: 12, marginTop: 4, lineHeight: 1.35 }}>
                        {d === "self" ? "Collect or hand it over yourself, no extra fee" : "We arrange the courier, adds an 8% delivery fee"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setStep(1)} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ← Back
            </button>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => addAnother()}
                style={{ border: "1.5px solid #6A9331", background: "none", color: "#3A2611", padding: "15px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Save &amp; add another plant
              </button>
              <button onClick={() => setStep(3)} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "15px 30px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Next: review →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="pl-rise" style={{ display: "grid", gap: 20 }}>
          <div data-r="split" style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 24, border: "1px solid rgba(58,38,17,.14)", borderRadius: 20, padding: 22 }}>
            <div style={{ aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#EBE2CE" }}>
              <img src={draft.photos[0] || "/img/pink-princess.jpg"} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <span style={{ display: "inline-block", background: MODES[draft.mode].bg, color: MODES[draft.mode].fg, padding: "5px 12px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em" }}>
                {MODES[draft.mode].badge}
              </span>
              <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 23, letterSpacing: "-.025em", margin: "13px 0 6px" }}>{draft.name}</div>
              <div style={{ color: "#7A6A4E", fontSize: 13.5 }}>
                {draft.region} · listed today{draft.mode !== "swap" ? " · " + (draft.delivery === "courier" ? "PlantLuva courier" : "Self delivery") : ""}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, margin: "15px 0 11px" }}>
                {draft.mode === "swap" ? "Up for trade" : draft.mode === "rent" ? "TT$" + (draft.price || "300") + "/day" : "TT$" + (draft.price || "0")}
              </div>
              <p style={{ color: "#63543A", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
                {draft.blurb || "Mother plant, three years in the same pot, new leaf every six weeks."}
              </p>
            </div>
          </div>
          {batch.length ? (
            <div style={{ border: "1px solid rgba(58,38,17,.14)", borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", color: "#7A6A4E", marginBottom: 14 }}>ALSO IN THIS SUBMISSION ({batch.length})</div>
              <div style={{ display: "grid", gap: 9 }}>
                {batch.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "#F5EEDC", borderRadius: 13, padding: "12px 14px" }}>
                    <span style={{ background: MODES[b.mode].bg, color: MODES[b.mode].fg, padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", flexShrink: 0 }}>
                      {MODES[b.mode].badge}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "#3A2611", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div style={{ color: "#7A6A4E", fontSize: 12.5, marginTop: 2 }}>
                        {b.region} · {b.mode === "swap" ? "Up for trade" : "TT$" + (b.price || "0")}
                      </div>
                    </div>
                    <button
                      onClick={() => editQueued(i)}
                      title="Edit"
                      style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", color: "#3A2611", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 12px", borderRadius: 999, flexShrink: 0 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setBatch((list) => list.filter((_, j) => j !== i))}
                      title="Remove"
                      style={{ border: 0, background: "none", color: "#7A6A4E", fontSize: 17, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div style={{ background: "#DCE3BC", borderRadius: 16, padding: 20, fontSize: 14, lineHeight: 1.55, color: "#63543A" }}>
            {draft.mode === "swap"
              ? "Label it with the species and how you grow it, check it over for pests, and be willing to part with it. Trades are between the two of you; we just hold the chat and the handover record."
              : draft.delivery === "courier"
              ? "PlantLuva takes 8% when the plant sells or the rental completes, plus 8% for courier delivery — 16% total. Payouts reach your bank two working days after handover, or your WiPay wallet the same evening."
              : "PlantLuva takes 8% when the plant sells or the rental completes. You're handling delivery yourself, so no extra delivery fee applies. Payouts reach your bank two working days after handover, or your WiPay wallet the same evening."}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setStep(2)} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "15px 26px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ← Back
            </button>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => addAnother("duplicate")}
                title="Start the next listing as a copy of this one"
                style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", color: "#63543A", padding: "15px 20px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ⧉ Duplicate
              </button>
              <button
                onClick={() => addAnother()}
                style={{ border: "1.5px solid #6A9331", background: "none", color: "#3A2611", padding: "15px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Add another plant
              </button>
              <button
                onClick={publish}
                disabled={submitting}
                style={{ border: 0, background: "#F5A644", color: "#FDF9EE", padding: "15px 32px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", whiteSpace: "nowrap", opacity: submitting ? 0.7 : 1 }}
              >
                {batch.length ? "Submit " + (batch.length + 1) + " listings" : "Submit listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
