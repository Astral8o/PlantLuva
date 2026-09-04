"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart, useSaved } from "@/components/ListStateProvider";

function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  return (
    <div
      data-r="search"
      style={{
        flex: "1 1 0",
        minWidth: 0,
        maxWidth: 380,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#FDF9EE",
        border: "1px solid rgba(58,38,17,.14)",
        borderRadius: 999,
        padding: "11px 16px",
        overflow: "hidden",
      }}
    >
      <span style={{ color: "#6F6249" }}>⌕</span>
      <input
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          const params = new URLSearchParams(searchParams.toString());
          if (v) params.set("q", v);
          else params.delete("q");
          router.push("/?" + params.toString());
        }}
        aria-label="Search plants by name or species"
        placeholder="Search anthurium, monstera…"
        style={{ border: 0, background: "none", outline: "none", width: "100%", minWidth: 0, fontSize: 13.5 }}
      />
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, profile, requireAuth, signOut } = useAuth();
  const cart = useCart();
  const saved = useSaved();

  const navItems = [
    { href: "/", label: "Shop", active: pathname === "/" },
    { href: "/about", label: "About", active: pathname === "/about" },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "#F5EEDC", borderBottom: "1px solid rgba(58,38,17,.14)" }}>
      <div
        data-r="hrow pad"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 24px",
          height: 74,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#6A9331",
              display: "grid",
              placeItems: "center",
              color: "#F2C438",
              fontFamily: "var(--font-gluten)",
              fontWeight: 800,
              fontSize: 15,
              paddingBottom: 2,
            }}
          >
            ♥
          </div>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19, letterSpacing: "-.01em", color: "#6A9331" }}>
            Plant<span aria-hidden="true" style={{ color: "#F2C438" }}>♥</span>Luva
          </div>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.active ? "page" : undefined}
              style={{
                border: 0,
                background: n.active ? "#DCE3BC" : "transparent",
                color: n.active ? "#2C1C0B" : "#5A4B33",
                padding: "13px 13px",
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Suspense fallback={<div style={{ flex: 1 }} />}>
          <SearchBox />
        </Suspense>
        <div data-r="ctrls" style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: "auto", flexShrink: 0 }}>
          {user ? (
            <Link
              href="/messages"
              style={{
                position: "relative",
                border: "1px solid rgba(58,38,17,.14)",
                background: "none",
                height: 40,
                padding: "0 12px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Messages
            </Link>
          ) : null}
          <Link
            href="/saved"
            aria-label={"Saved plants" + (saved.ids.length ? " (" + saved.ids.length + ")" : "")}
            style={{
              position: "relative",
              border: "1px solid rgba(58,38,17,.14)",
              background: "none",
              width: 40,
              height: 40,
              borderRadius: "50%",
              fontSize: 15,
              display: "grid",
              placeItems: "center",
            }}
          >
            ♡
            {saved.ids.length ? (
              <span
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#F5A644",
                  color: "#fff",
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  padding: "0 5px",
                }}
              >
                {saved.ids.length}
              </span>
            ) : null}
          </Link>
          <Link
            href="/basket"
            title="Basket"
            style={{
              position: "relative",
              border: "1px solid rgba(58,38,17,.14)",
              background: "none",
              height: 40,
              padding: "0 12px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Basket
            {cart.ids.length ? (
              <span
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#6A9331",
                  color: "#F5EEDC",
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  padding: "0 5px",
                }}
              >
                {cart.ids.length}
              </span>
            ) : null}
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                title="Your shelf"
                style={{
                  border: "1px solid rgba(58,38,17,.14)",
                  background: "none",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  overflow: "hidden",
                  padding: 0,
                  display: "block",
                }}
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="You" width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#DCE3BC", display: "grid", placeItems: "center", fontWeight: 700 }}>
                    {(profile?.first_name || "?")[0]}
                  </div>
                )}
              </Link>
              <button
                onClick={signOut}
                style={{ border: 0, background: "none", color: "#7A6A4E", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", padding: "0 4px" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => requireAuth("in")}
              title="For buyers"
              style={{
                border: "1px solid rgba(58,38,17,.2)",
                background: "none",
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                color: "#3A2611",
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
