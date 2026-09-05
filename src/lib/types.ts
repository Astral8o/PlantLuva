import type { Tables } from "@/lib/database.types";

export type Profile = Tables<"profiles"> & { seller_type?: "individual" | "business" | null };
export type Listing = Tables<"listings"> & { category?: "plant" | "merch" | null; delivery_method?: "self" | "courier" | null };
export type Bid = Tables<"bids">;
export type SwapOffer = Tables<"swap_offers">;
export type RentalRequest = Tables<"rental_requests">;
export type Thread = Tables<"threads">;
export type Message = Tables<"messages">;

export type ListingWithSeller = Listing & { seller: Profile };
