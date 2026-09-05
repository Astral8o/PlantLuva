"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { MODES } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demoMode";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  requireAuth: (mode: "in" | "up", opts?: { seller?: boolean; onSuccess?: () => void }) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const flash = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [forSeller, setForSeller] = useState(false);
  const [sellerType, setSellerType] = useState<"individual" | "business">("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const successRef = useRef<(() => void) | undefined>(undefined);
  const lastFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadProfile]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const f = [...dialogRef.current.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea")].filter(
        (n) => !(n as HTMLButtonElement).disabled && n.offsetParent !== null
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  function close() {
    setModalOpen(false);
    setPassword("");
    const el = lastFocus.current;
    if (el) setTimeout(() => el.focus(), 0);
  }

  const requireAuth: AuthContextValue["requireAuth"] = useCallback(
    (m, opts) => {
      lastFocus.current = document.activeElement as HTMLElement;
      if (user) {
        opts?.onSuccess?.();
        return;
      }
      setMode(m);
      setForSeller(!!opts?.seller);
      successRef.current = opts?.onSuccess;
      setModalOpen(true);
    },
    [user]
  );

  async function submit() {
    if (!email.trim() || !password.trim()) return flash("Enter your email and password");
    if (DEMO_MODE) {
      const displayName = name || email.split("@")[0];
      const firstName = forSeller && sellerType === "business" ? displayName : displayName.split(" ")[0];
      setUser({ id: "demo-user", email } as User);
      setProfile({
        id: "demo-user",
        name: displayName,
        first_name: firstName,
        region: "Port of Spain",
        bio: null,
        avatar_url: null,
        rating: 5,
        is_grower: true,
        seller_type: forSeller ? sellerType : "individual",
        created_at: new Date().toISOString(),
      });
      setModalOpen(false);
      setPassword("");
      flash(mode === "up" ? "Account created. Welcome to PlantLuva" : "Signed in");
      successRef.current?.();
      return;
    }
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || email.split("@")[0] } },
      });
      if (error) return flash(error.message);
      flash("Account created. Welcome to PlantLuva");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return flash(error.message);
      flash("Signed in");
    }
    setModalOpen(false);
    setPassword("");
    successRef.current?.();
  }

  async function signOut() {
    if (DEMO_MODE) {
      setUser(null);
      setProfile(null);
      flash("Signed out");
      return;
    }
    await supabase.auth.signOut();
    flash("Signed out");
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, requireAuth, signOut }}>
      {children}
      {modalOpen ? (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(58,38,17,.55)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
            className="pl-auth-dialog"
            style={{
              width: "100%",
              maxWidth: 860,
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#FDF9EE",
              borderRadius: 26,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              boxShadow: "0 28px 70px rgba(58,38,17,.35)",
            }}
          >
            <div
              className="pl-auth-art"
              style={{ position: "relative", minHeight: 450, background: "#EBE2CE" }}
            >
              <img
                src="/img/potting-shop.jpg"
                alt=""
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top,rgba(58,38,17,.92),rgba(58,38,17,.12))",
                }}
              />
              <div
                style={{
                  position: "relative",
                  padding: 32,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 23, color: "#FDF9EE", lineHeight: 1.14 }}>
                  Sell it. Bid it.
                  <br />
                  Swap it. Rent it.
                </div>
                <p style={{ color: "rgba(253,249,238,.78)", fontSize: 13.5, lineHeight: 1.5, margin: "11px 0 0" }}>
                  Trinidad &amp; Tobago&apos;s shelf, shared.
                </p>
              </div>
            </div>
            <div style={{ padding: "34px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <h2
                  id="auth-title"
                  style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 25, letterSpacing: "-.02em", margin: 0, color: "#3A2611" }}
                >
                  {forSeller ? "Sell on PlantLuva" : mode === "up" ? "Join PlantLuva" : "Welcome back"}
                </h2>
                <button
                  onClick={close}
                  aria-label="Close sign in"
                  title="Close"
                  style={{
                    border: 0,
                    background: "none",
                    fontSize: 21,
                    color: "#5A4B33",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "8px 12px",
                    margin: "-8px -8px 0 0",
                    minHeight: 40,
                    minWidth: 40,
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ color: "#63543A", fontSize: 14, lineHeight: 1.55, margin: "9px 0 18px" }}>
                {forSeller
                  ? "Sign in to post a plant. We review every listing before it reaches the shelf, so buyers know what they are getting is safe and trusted."
                  : "Four ways to take a plant home off somebody else's shelf."}
              </p>
              {forSeller && mode === "up" ? (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 8 }}>
                    HOW WILL YOU SELL?
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["individual", "business"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSellerType(t)}
                        style={{
                          border: "2px solid " + (sellerType === t ? "#6A9331" : "rgba(58,38,17,.14)"),
                          background: sellerType === t ? "#F5EEDC" : "transparent",
                          borderRadius: 12,
                          padding: "12px 13px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 14, color: "#3A2611" }}>
                          {t === "individual" ? "Individual seller" : "Plant shop"}
                        </div>
                        <div style={{ color: "#7A6A4E", fontSize: 11.5, marginTop: 3, lineHeight: 1.35 }}>
                          {t === "individual" ? "Selling from your own collection" : "A nursery or registered business"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {!forSeller ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {[
                    ["$", "Buy it", "sale"],
                    ["↑", "Bid on it", "bid"],
                    ["⇄", "Swap it", "swap"],
                    ["◷", "Rent it", "rent"],
                  ].map(([icon, label, k]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        background: "#F5EEDC",
                        border: "1px solid rgba(58,38,17,.12)",
                        borderRadius: 12,
                        padding: "11px 12px",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: MODES[k as keyof typeof MODES].bg,
                          color: MODES[k as keyof typeof MODES].fg,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#3A2611" }}>{label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 13 }}>
                {mode === "up" ? (
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 6 }}>
                      {forSeller && sellerType === "business" ? "SHOP / BUSINESS NAME" : "NAME"}
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={forSeller && sellerType === "business" ? "Dexter's Backyard Nursery" : "Kavita Ramdeen"}
                      style={inputStyle}
                    />
                  </label>
                ) : null}
                {mode === "up" && forSeller && sellerType === "business" ? (
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 6 }}>
                      BUSINESS REG. # (OPTIONAL)
                    </span>
                    <input
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="BN-000000"
                      style={inputStyle}
                    />
                  </label>
                ) : null}
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 6 }}>
                    EMAIL
                  </span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".11em", color: "#7A6A4E", marginBottom: 6 }}>
                    PASSWORD
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={inputStyle}
                  />
                </label>
              </div>
              <button
                onClick={submit}
                style={{
                  width: "100%",
                  marginTop: 20,
                  border: 0,
                  background: "#6A9331",
                  color: "#F5EEDC",
                  padding: 16,
                  borderRadius: 14,
                  fontFamily: "var(--font-gluten)",
                  fontWeight: 700,
                  fontSize: 15.5,
                  cursor: "pointer",
                }}
              >
                {mode === "up" ? "Create account" : "Sign in"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, fontSize: 13.5, color: "#7A6A4E" }}>
                <span>{mode === "up" ? "Already have an account?" : "New here?"}</span>
                <button
                  onClick={() => setMode(mode === "up" ? "in" : "up")}
                  style={{ border: 0, background: "none", color: "#4F6E24", fontSize: 13.5, fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  {mode === "up" ? "Sign in" : "Create one"}
                </button>
              </div>
              <p style={{ color: "#6F6249", fontSize: 12, lineHeight: 1.5, margin: "16px 0 0" }}>
                Swapping is always free. Selling, bidding and renting carry the standard 8% transaction fee. Deliver it yourself for no extra cost, or let PlantLuva courier handle it for another 8%.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(58,38,17,.2)",
  background: "#F5EEDC",
  borderRadius: 12,
  padding: "13px 15px",
  fontSize: 14.5,
  fontFamily: "inherit",
  color: "#3A2611",
};
