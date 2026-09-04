export type Mode = "sale" | "bid" | "swap" | "rent";

export const MODES: Record<
  Mode,
  { badge: string; bg: string; fg: string; dot: string; price: string }
> = {
  sale: { badge: "FOR SALE", bg: "#4F6E24", fg: "#FDF9EE", dot: "#6A9331", price: "#3A2611" },
  bid: { badge: "BIDDING", bg: "#F5A644", fg: "#3A2611", dot: "#F5A644", price: "#A15A05" },
  swap: { badge: "SWAP", bg: "#B0C35C", fg: "#3A2611", dot: "#B0C35C", price: "#7A6A4E" },
  rent: { badge: "FOR RENT", bg: "#EFB53F", fg: "#3A2611", dot: "#EFB53F", price: "#3A2611" },
};

export const MERCH_BADGE = { badge: "MERCH", bg: "#5C8AA6", fg: "#FDF9EE", dot: "#5C8AA6", price: "#2C4A5E" };

export const REGIONS = [
  "Port of Spain",
  "San Fernando",
  "Chaguanas",
  "Arima",
  "Diego Martin",
  "Tobago",
];

export const SIZES = ["Small", "Medium", "Large", "Extra large"];
export const CARE_LEVELS = ["Easy", "Medium", "Fussy"];

export const PAY_OPTIONS = ["WiPay card", "Bank transfer", "Cash on pickup", "Rental deposit"];
