import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function ensureThread(
  supabase: SupabaseClient<Database>,
  buyerId: string,
  sellerId: string,
  listingId?: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("threads")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("threads")
    .insert({ buyer_id: buyerId, seller_id: sellerId, listing_id: listingId })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}
