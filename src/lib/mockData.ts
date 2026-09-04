import type { ListingWithSeller, Profile } from "@/lib/types";

const now = new Date().toISOString();
const days = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const MOCK_SELLERS: Record<string, Profile> = {
  kavita: {
    id: "mock-kavita",
    name: "Kavita R.",
    first_name: "Kavita",
    region: "Port of Spain",
    bio: "Aroid hoarder since the lockdown. Everything on my shelf is grown in my own back gallery, no imports, no mystery cuttings.",
    avatar_url: "/img/carry.png",
    rating: 4.9,
    is_grower: true,
    created_at: now,
  },
  dexter: {
    id: "mock-dexter",
    name: "Dexter M.",
    first_name: "Dexter",
    region: "Chaguanas",
    bio: "Backyard nursery in Chaguanas. Big specimen plants for events, plus whatever the mother plants throw off.",
    avatar_url: "/img/selloum.png",
    rating: 4.8,
    is_grower: true,
    created_at: now,
  },
  shivani: {
    id: "mock-shivani",
    name: "Shivani P.",
    first_name: "Shivani",
    region: "San Fernando",
    bio: "I trade more than I sell. Always hunting variegated anything, talk to me before you list it.",
    avatar_url: "/img/gloriosum.png",
    rating: 5.0,
    is_grower: true,
    created_at: now,
  },
  andre: {
    id: "mock-andre",
    name: "Andre B.",
    first_name: "Andre",
    region: "Tobago",
    bio: "Tobago side. Orchids, heliconia and anthurium raised in shade house, shipped over on the ferry Wednesdays.",
    avatar_url: "/img/cone.png",
    rating: 4.7,
    is_grower: true,
    created_at: now,
  },
};

const IMG = ["/img/gloriosum.png", "/img/cone.png", "/img/selloum.png", "/img/jungle.png", "/img/carry.png"];

interface Raw {
  id: string;
  name: string;
  latin: string;
  mode: "sale" | "bid" | "swap" | "rent";
  price: number | null;
  img: string;
  seller: keyof typeof MOCK_SELLERS;
  region: string;
  size: string;
  care: string;
  light: string;
  blurb: string;
  wants?: string[];
  startBid?: number;
  endsInDays?: number;
}

const RAW: Raw[] = [
  { id: "l1", name: "Philodendron Gloriosum", latin: "P. gloriosum", mode: "sale", price: 850, img: IMG[0], seller: "kavita", region: "Port of Spain", size: "Medium", care: "Easy", light: "Bright indirect", blurb: "Mother plant, three years in the same trough. Creeping rhizome with four established leaves and a fifth unfurling. Velvet leaves, cream veins, the real gloriosum, not a McDowell." },
  { id: "l2", name: "Anthurium Warocqueanum", latin: "A. warocqueanum", mode: "bid", price: null, img: IMG[1], seller: "shivani", region: "San Fernando", size: "Large", care: "Fussy", light: "Filtered morning sun", blurb: "Queen anthurium, 62cm longest leaf. Grown in a shade house in San Fernando, never seen a greenhouse import. Sold as-is, collection preferred.", startBid: 1200, endsInDays: 1.5 },
  { id: "l3", name: "Monstera Deliciosa (mature)", latin: "M. deliciosa", mode: "rent", price: 350, img: IMG[2], seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Anything", blurb: "1.8m across, twelve fenestrated leaves, sits in a matte black urn. Rents by the day for weddings, shoots and launches. Needs a van and two people." },
  { id: "l4", name: "Aglaonema Pictum Tricolour", latin: "A. pictum", mode: "swap", price: null, img: IMG[3], seller: "shivani", region: "San Fernando", size: "Small", care: "Medium", light: "Low to medium", blurb: "Camouflage aglaonema, three heads in a 6\" pot. Not selling this one, looking to trade for something I do not have yet.", wants: ["Variegated Monstera", "Anthurium Clarinervium", "Philodendron Melanochrysum"] },
  { id: "l5", name: "Alocasia Frydek Variegata", latin: "A. micholitziana", mode: "bid", price: null, img: IMG[0], seller: "kavita", region: "Port of Spain", size: "Medium", care: "Fussy", light: "Bright indirect", blurb: "Half-moon variegation on two of five leaves, corm attached. Bidding closes Thursday night.", startBid: 600, endsInDays: 0.7 },
  { id: "l6", name: "Heliconia Rostrata clump", latin: "H. rostrata", mode: "sale", price: 240, img: IMG[2], seller: "andre", region: "Tobago", size: "Large", care: "Easy", light: "Full sun", blurb: "Hanging lobster claw, divided from a mature clump in Scarborough. Two rhizomes per bag, flowers in its second season." },
  { id: "l7", name: "Philodendron Melanochrysum", latin: "P. melanochrysum", mode: "swap", price: null, img: IMG[1], seller: "kavita", region: "Port of Spain", size: "Medium", care: "Medium", light: "Bright indirect", blurb: "Rooted top cut, two leaves already darkening. Trade only, I have too many of these and not enough of what you have.", wants: ["Anthurium Warocqueanum", "Philodendron Verrucosum", "Any Aglaonema Pictum"] },
  { id: "l8", name: "Cattleya Orchid (in spike)", latin: "Cattleya sp.", mode: "sale", price: 420, img: IMG[3], seller: "andre", region: "Tobago", size: "Small", care: "Medium", light: "Bright indirect", blurb: "In spike now, should open within three weeks. Mounted on hardwood, comes on the Wednesday ferry or collect in Scarborough." },
  { id: "l9", name: "Selloum Philodendron 1.8m", latin: "Thaumatophyllum bipinnatifidum", mode: "rent", price: 300, img: IMG[2], seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Anything", blurb: "The one everybody rents for backdrops. Two available, matching black pots, delivered upright and collected next morning." },
  { id: "l10", name: "Anthurium Crystallinum", latin: "A. crystallinum", mode: "sale", price: 560, img: IMG[1], seller: "shivani", region: "San Fernando", size: "Medium", care: "Medium", light: "Filtered light", blurb: "Silver-veined, six leaves, established in a 6\" net pot. Straight-forward grower once the humidity holds." },
  { id: "l11", name: "Snake Plant Moonshine", latin: "Dracaena trifasciata", mode: "sale", price: 95, img: IMG[0], seller: "dexter", region: "Chaguanas", size: "Small", care: "Easy", light: "Anything", blurb: "Pale silver-green blades, three pups per pot. The plant you give somebody who says they kill everything." },
  { id: "l12", name: "Bird of Paradise (event size)", latin: "Strelitzia nicolai", mode: "rent", price: 400, img: IMG[2], seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Full sun", blurb: "2.2m, ten paddle leaves, dramatic on either side of a doorway. Weekend rate covers Friday delivery to Sunday collection." },
  { id: "l13", name: "Calathea Makoyana", latin: "Goeppertia makoyana", mode: "swap", price: null, img: IMG[3], seller: "andre", region: "Tobago", size: "Small", care: "Fussy", light: "Low to medium", blurb: "Peacock plant, full pot, no crisp edges. Happy to trade for anything I can grow outside in Tobago.", wants: ["Heliconia divisions", "Cattleya orchids", "Alocasia Frydek"] },
  { id: "l14", name: "Zamioculcas Zamiifolia", latin: "Z. zamiifolia", mode: "sale", price: 180, img: IMG[1], seller: "kavita", region: "Port of Spain", size: "Medium", care: "Easy", light: "Low", blurb: "Seven stems, thick rhizome, has survived two vacations with no water. Excellent office plant." },
  { id: "l15", name: "Variegated Monstera Albo", latin: "M. deliciosa albo", mode: "bid", price: null, img: IMG[0], seller: "shivani", region: "San Fernando", size: "Medium", care: "Medium", light: "Bright indirect", blurb: "Three-node cutting, high variegation on both leaves, rooted in water and moved to bark. Serious bidders, this is a real albo, papers on request.", startBid: 2400, endsInDays: 2.5 },
  { id: "l16", name: "Ficus Elastica Ruby", latin: "F. elastica", mode: "sale", price: 320, img: IMG[3], seller: "andre", region: "Tobago", size: "Large", care: "Easy", light: "Bright light", blurb: "Pink and cream new growth, 90cm tall, single trunk staked straight. Photographs better than it looks in person, and it looks good." },
];

export const MOCK_LISTINGS: ListingWithSeller[] = RAW.map((r) => ({
  id: r.id,
  seller_id: MOCK_SELLERS[r.seller].id,
  name: r.name,
  latin_name: r.latin,
  mode: r.mode,
  price: r.price,
  start_bid: r.startBid ?? null,
  ends_at: r.endsInDays != null ? days(r.endsInDays) : null,
  region: r.region,
  size: r.size,
  care: r.care,
  light: r.light,
  blurb: r.blurb,
  wants: r.wants ?? [],
  images: [r.img],
  status: "live",
  created_at: now,
  seller: MOCK_SELLERS[r.seller],
}));

export const MOCK_BIDS: Record<string, { id: string; amount: number; created_at: string; bidder_id: string; bidder_name: string }[]> = {
  l2: [
    { id: "b1", amount: 1450, bidder_id: "mock-rishi", bidder_name: "Rishi D.", created_at: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: "b2", amount: 1300, bidder_id: "mock-nalini", bidder_name: "Nalini S.", created_at: new Date(Date.now() - 40 * 60000).toISOString() },
    { id: "b3", amount: 1200, bidder_id: "mock-kavita", bidder_name: "Kavita R.", created_at: new Date(Date.now() - 120 * 60000).toISOString() },
  ],
  l5: [
    { id: "b4", amount: 720, bidder_id: "mock-terri", bidder_name: "Terri A.", created_at: new Date(Date.now() - 6 * 60000).toISOString() },
    { id: "b5", amount: 650, bidder_id: "mock-dexter", bidder_name: "Dexter M.", created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  ],
  l15: [
    { id: "b6", amount: 2900, bidder_id: "mock-marlon", bidder_name: "Marlon G.", created_at: new Date(Date.now() - 22 * 60000).toISOString() },
    { id: "b7", amount: 2650, bidder_id: "mock-shanice", bidder_name: "Shanice B.", created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: "b8", amount: 2400, bidder_id: "mock-rishi", bidder_name: "Rishi D.", created_at: new Date(Date.now() - 180 * 60000).toISOString() },
  ],
};
