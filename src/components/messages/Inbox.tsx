"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { timeAgo } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { DEMO_MODE } from "@/lib/demoMode";

interface ThreadVM {
  id: string;
  counterpart: Profile;
  preview: string;
  when: string;
}

interface MessageVM {
  id: string;
  text: string;
  when: string;
  mine: boolean;
}

export function Inbox() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, requireAuth } = useAuth();

  const [threads, setThreads] = useState<ThreadVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageVM[]>([]);
  const [draft, setDraft] = useState("");
  const activeThreadId = searchParams.get("thread") || threads[0]?.id || "";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (DEMO_MODE) {
      setThreads([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data: threadRows } = await supabase
        .from("threads")
        .select("id, buyer_id, seller_id, buyer:profiles!threads_buyer_id_fkey(*), seller:profiles!threads_seller_id_fkey(*)")
        .or("buyer_id.eq." + user.id + ",seller_id.eq." + user.id)
        .order("created_at", { ascending: false });

      type Row = { id: string; buyer_id: string; seller_id: string; buyer: Profile; seller: Profile };
      const rows = (threadRows as unknown as Row[]) || [];
      const ids = rows.map((r) => r.id);
      const previews: Record<string, { text: string; created_at: string }> = {};
      if (ids.length) {
        const { data: msgRows } = await supabase
          .from("messages")
          .select("thread_id, text, created_at")
          .in("thread_id", ids)
          .order("created_at", { ascending: false });
        for (const m of msgRows || []) {
          if (!previews[m.thread_id]) previews[m.thread_id] = { text: m.text, created_at: m.created_at };
        }
      }
      setThreads(
        rows.map((r) => ({
          id: r.id,
          counterpart: r.buyer_id === user.id ? r.seller : r.buyer,
          preview: previews[r.id]?.text || "Say hello",
          when: previews[r.id] ? timeAgo(previews[r.id].created_at) : "",
        }))
      );
      setLoading(false);
    })();
  }, [user, supabase]);

  useEffect(() => {
    if (!activeThreadId || DEMO_MODE) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("messages").select("*").eq("thread_id", activeThreadId).order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages((data || []).map((m) => ({ id: m.id, text: m.text, when: timeAgo(m.created_at), mine: m.sender_id === user?.id })));
    })();

    const channel = supabase
      .channel("thread-" + activeThreadId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "thread_id=eq." + activeThreadId }, (payload) => {
        const m = payload.new as { id: string; text: string; created_at: string; sender_id: string };
        setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, { id: m.id, text: m.text, when: timeAgo(m.created_at), mine: m.sender_id === user?.id }]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeThreadId, supabase, user?.id]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId), [threads, activeThreadId]);

  async function send() {
    if (DEMO_MODE) return;
    const text = draft.trim();
    if (!text || !user || !activeThreadId) return;
    setDraft("");
    await supabase.from("messages").insert({ thread_id: activeThreadId, sender_id: user.id, text });
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 60px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.03em" }}>Messages</h1>
        <p style={{ color: "#7A6A4E", margin: "12px 0 24px" }}>Sign in to see your conversations with growers.</p>
        <button
          onClick={() => requireAuth("in")}
          style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main data-r="pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 60px" }}>
      <h1 style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", margin: "0 0 22px" }}>Messages</h1>
      {loading ? (
        <div style={{ color: "#7A6A4E" }}>Loading…</div>
      ) : threads.length === 0 ? (
        <div style={{ border: "1.5px dashed rgba(58,38,17,.22)", borderRadius: 20, padding: "70px 30px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-gluten)", fontWeight: 800, fontSize: 19 }}>No conversations yet</div>
          <p style={{ color: "#7A6A4E", fontSize: 14.5, margin: "10px 0 20px" }}>{DEMO_MODE ? "Messaging is disabled in demo mode." : "Message a seller from any listing to start one."}</p>
          <Link href="/" style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 13.5, fontWeight: 700 }}>
            Back to the marketplace
          </Link>
        </div>
      ) : (
        <div data-r="threads" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, border: "1px solid rgba(58,38,17,.14)", borderRadius: 20, overflow: "hidden", height: 620 }}>
          <div style={{ borderRight: "1px solid rgba(58,38,17,.14)", overflowY: "auto", background: "#F5EEDC" }}>
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push("/messages?thread=" + t.id)}
                style={{ display: "flex", gap: 13, padding: "16px 18px", cursor: "pointer", background: t.id === activeThreadId ? "#FDF9EE" : "transparent", borderBottom: "1px solid rgba(58,38,17,.1)" }}
              >
                <img src={t.counterpart?.avatar_url || "/img/carry.png"} alt={t.counterpart?.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{t.counterpart?.name}</span>
                    <span style={{ color: "#6F6249", fontSize: 11.5 }}>{t.when}</span>
                  </div>
                  <div style={{ color: "#63543A", fontSize: 13, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.preview}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            {activeThread ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 20px", borderBottom: "1px solid rgba(58,38,17,.14)" }}>
                  <img src={activeThread.counterpart?.avatar_url || "/img/carry.png"} alt={activeThread.counterpart?.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{activeThread.counterpart?.name}</div>
                    <div style={{ color: "#7A6A4E", fontSize: 12.5 }}>{activeThread.counterpart?.region}</div>
                  </div>
                  <Link href={"/seller/" + activeThread.counterpart?.id} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "9px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
                    View shelf
                  </Link>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 11, background: "#FDF9EE" }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="pl-rise"
                      style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "74%", background: m.mine ? "#6A9331" : "#F5EEDC", color: m.mine ? "#F5EEDC" : "#3A2611", padding: "12px 16px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.45 }}
                    >
                      {m.text}
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>{m.when}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, padding: "16px 20px", borderTop: "1px solid rgba(58,38,17,.14)" }}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                    placeholder="Ask about size, collection, or trade…"
                    style={{ flex: 1, border: "1px solid rgba(58,38,17,.18)", borderRadius: 999, padding: "13px 18px", background: "#FDF9EE", outline: "none", fontSize: 14 }}
                  />
                  <button onClick={send} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "13px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Send
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
