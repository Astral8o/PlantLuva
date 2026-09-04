"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { ensureThread } from "@/lib/messaging";
import { useToast } from "@/components/ToastProvider";

export function SellerChatButton({ sellerId, firstName }: { sellerId: string; firstName: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { requireAuth } = useAuth();
  const flash = useToast();

  async function goChat() {
    requireAuth("in", {
      onSuccess: async () => {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return;
        if (uid === sellerId) {
          flash("This is your own shelf");
          return;
        }
        const threadId = await ensureThread(supabase, uid, sellerId);
        router.push("/messages" + (threadId ? "?thread=" + threadId : ""));
      },
    });
  }

  function share() {
    if (typeof window !== "undefined") navigator.clipboard?.writeText(window.location.href).catch(() => {});
    flash("Link copied, paste it in your WhatsApp status");
  }

  return (
    <>
      <button onClick={goChat} style={{ border: 0, background: "#6A9331", color: "#F5EEDC", padding: "14px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Message {firstName}
      </button>
      <button onClick={share} style={{ border: "1px solid rgba(58,38,17,.2)", background: "none", padding: "14px 20px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        ↗ Share
      </button>
    </>
  );
}
