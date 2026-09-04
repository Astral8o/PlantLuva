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
    avatar_url: "/img/potting-shop.jpg",
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
    avatar_url: "/img/monstera-corner.jpg",
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
    avatar_url: "/img/philodendron-black-bowl.jpg",
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
    avatar_url: "/img/calathea-gift-bag.jpg",
    rating: 4.7,
    is_grower: true,
    created_at: now,
  },
};

const ALL_PHOTOS = [
  "/img/pink-princess.jpg",
  "/img/philodendron-black-bowl.jpg",
  "/img/fishbone-cactus.jpg",
  "/img/ficus-elastica-ruby.jpg",
  "/img/monstera-corner.jpg",
  "/img/calathea-gift-bag.jpg",
  "/img/succulent-trio.jpg",
  "/img/potting-shop.jpg",
];

function galleryFor(primary: string, index: number, category: "plant" | "merch"): string[] {
  if (category === "merch") return [primary];
  const others = ALL_PHOTOS.filter((p) => p !== primary);
  const count = 2 + (index % 4); // 2 to 5 photos per plant listing
  const imgs = [primary];
  for (let i = 0; i < count - 1; i++) imgs.push(others[(index + i) % others.length]);
  return imgs;
}

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
  category?: "plant" | "merch";
}

const RAW: Raw[] = [
  { id: "l1", name: "Philodendron Gloriosum", latin: "P. gloriosum", mode: "sale", price: 850, img: "/img/pink-princess.jpg", seller: "kavita", region: "Port of Spain", size: "Medium", care: "Easy", light: "Bright indirect", blurb: "Mother plant, three years in the same trough. Creeping rhizome with four established leaves and a fifth unfurling. Velvet leaves, cream veins, the real gloriosum, not a McDowell." },
  { id: "l2", name: "Anthurium Warocqueanum", latin: "A. warocqueanum", mode: "bid", price: null, img: "/img/philodendron-black-bowl.jpg", seller: "shivani", region: "San Fernando", size: "Large", care: "Fussy", light: "Filtered morning sun", blurb: "Queen anthurium, 62cm longest leaf. Grown in a shade house in San Fernando, never seen a greenhouse import. Sold as-is, collection preferred.", startBid: 1200, endsInDays: 1.5 },
  { id: "l3", name: "Monstera Deliciosa (mature)", latin: "M. deliciosa", mode: "rent", price: 350, img: "/img/monstera-corner.jpg", seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Anything", blurb: "1.8m across, twelve fenestrated leaves, sits in a matte black urn. Rents by the day for weddings, shoots and launches. Needs a van and two people." },
  { id: "l4", name: "Aglaonema Pictum Tricolour", latin: "A. pictum", mode: "swap", price: null, img: "/img/fishbone-cactus.jpg", seller: "shivani", region: "San Fernando", size: "Small", care: "Medium", light: "Low to medium", blurb: "Camouflage aglaonema, three heads in a 6\" pot. Not selling this one, looking to trade for something I do not have yet.", wants: ["Variegated Monstera", "Anthurium Clarinervium", "Philodendron Melanochrysum"] },
  { id: "l5", name: "Alocasia Frydek Variegata", latin: "A. micholitziana", mode: "bid", price: null, img: "/img/ficus-elastica-ruby.jpg", seller: "kavita", region: "Port of Spain", size: "Medium", care: "Fussy", light: "Bright indirect", blurb: "Half-moon variegation on two of five leaves, corm attached. Bidding closes Thursday night.", startBid: 600, endsInDays: 0.7 },
  { id: "l6", name: "Heliconia Rostrata clump", latin: "H. rostrata", mode: "sale", price: 240, img: "/img/monstera-corner.jpg", seller: "andre", region: "Tobago", size: "Large", care: "Easy", light: "Full sun", blurb: "Hanging lobster claw, divided from a mature clump in Scarborough. Two rhizomes per bag, flowers in its second season." },
  { id: "l7", name: "Philodendron Melanochrysum", latin: "P. melanochrysum", mode: "swap", price: null, img: "/img/philodendron-black-bowl.jpg", seller: "kavita", region: "Port of Spain", size: "Medium", care: "Medium", light: "Bright indirect", blurb: "Rooted top cut, two leaves already darkening. Trade only, I have too many of these and not enough of what you have.", wants: ["Anthurium Warocqueanum", "Philodendron Verrucosum", "Any Aglaonema Pictum"] },
  { id: "l8", name: "Cattleya Orchid (in spike)", latin: "Cattleya sp.", mode: "sale", price: 420, img: "/img/calathea-gift-bag.jpg", seller: "andre", region: "Tobago", size: "Small", care: "Medium", light: "Bright indirect", blurb: "In spike now, should open within three weeks. Mounted on hardwood, comes on the Wednesday ferry or collect in Scarborough." },
  { id: "l9", name: "Selloum Philodendron 1.8m", latin: "Thaumatophyllum bipinnatifidum", mode: "rent", price: 300, img: "/img/succulent-trio.jpg", seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Anything", blurb: "The one everybody rents for backdrops. Two available, matching black pots, delivered upright and collected next morning." },
  { id: "l10", name: "Anthurium Crystallinum", latin: "A. crystallinum", mode: "sale", price: 560, img: "/img/potting-shop.jpg", seller: "shivani", region: "San Fernando", size: "Medium", care: "Medium", light: "Filtered light", blurb: "Silver-veined, six leaves, established in a 6\" net pot. Straight-forward grower once the humidity holds." },
  { id: "l11", name: "Snake Plant Moonshine", latin: "Dracaena trifasciata", mode: "sale", price: 95, img: "/img/pink-princess.jpg", seller: "dexter", region: "Chaguanas", size: "Small", care: "Easy", light: "Anything", blurb: "Pale silver-green blades, three pups per pot. The plant you give somebody who says they kill everything." },
  { id: "l12", name: "Bird of Paradise (event size)", latin: "Strelitzia nicolai", mode: "rent", price: 400, img: "/img/philodendron-black-bowl.jpg", seller: "dexter", region: "Chaguanas", size: "Extra large", care: "Easy", light: "Full sun", blurb: "2.2m, ten paddle leaves, dramatic on either side of a doorway. Weekend rate covers Friday delivery to Sunday collection." },
  { id: "l13", name: "Calathea Makoyana", latin: "Goeppertia makoyana", mode: "swap", price: null, img: "/img/calathea-gift-bag.jpg", seller: "andre", region: "Tobago", size: "Small", care: "Fussy", light: "Low to medium", blurb: "Peacock plant, full pot, no crisp edges. Happy to trade for anything I can grow outside in Tobago.", wants: ["Heliconia divisions", "Cattleya orchids", "Alocasia Frydek"] },
  { id: "l14", name: "Zamioculcas Zamiifolia", latin: "Z. zamiifolia", mode: "sale", price: 180, img: "/img/fishbone-cactus.jpg", seller: "kavita", region: "Port of Spain", size: "Medium", care: "Easy", light: "Low", blurb: "Seven stems, thick rhizome, has survived two vacations with no water. Excellent office plant." },
  { id: "l15", name: "Variegated Monstera Albo", latin: "M. deliciosa albo", mode: "bid", price: null, img: "/img/pink-princess.jpg", seller: "shivani", region: "San Fernando", size: "Medium", care: "Medium", light: "Bright indirect", blurb: "Three-node cutting, high variegation on both leaves, rooted in water and moved to bark. Serious bidders, this is a real albo, papers on request.", startBid: 2400, endsInDays: 2.5 },
  { id: "l16", name: "Ficus Elastica Ruby", latin: "F. elastica", mode: "sale", price: 320, img: "/img/ficus-elastica-ruby.jpg", seller: "andre", region: "Tobago", size: "Large", care: "Easy", light: "Bright light", blurb: "Pink and cream new growth, 90cm tall, single trunk staked straight. Photographs better than it looks in person, and it looks good." },
  { id: "l17", name: "Fishbone Cactus", latin: "Epiphyllum anguliger", mode: "sale", price: 140, img: "/img/fishbone-cactus.jpg", seller: "dexter", region: "Chaguanas", size: "Medium", care: "Easy", light: "Bright indirect", blurb: "Zigzag stems trailing out of a 6\" terracotta pot after a year of growth. Tough as nails once it's settled in, flowers in the cooler months if you're lucky." },
  { id: "l18", name: "Succulent Starter Trio", latin: "Assorted", mode: "sale", price: 75, img: "/img/succulent-trio.jpg", seller: "kavita", region: "Port of Spain", size: "Small", care: "Easy", light: "Bright light", blurb: "Three easy ones in 8cm ribbed pots, a jade, a haworthia and a crassula. The set I hand new plant parents who swear they'll kill everything." },
  { id: "m1", name: "PlantLuva Canvas Tote", latin: "PlantLuva merch", mode: "sale", price: 60, img: "/img/calathea-gift-bag.jpg", seller: "andre", region: "Tobago", size: "One size", care: "100% cotton canvas", light: "", blurb: "Sturdy enough for a gallon nursery pot without stretching. Natural canvas, PlantLuva heart screen-printed on the front.", category: "merch" },
  { id: "m2", name: "Ribbed Ceramic Pot Trio", latin: "PlantLuva merch", mode: "sale", price: 120, img: "/img/succulent-trio.jpg", seller: "kavita", region: "Port of Spain", size: "Small", care: "Glazed ceramic, drainage hole", light: "", blurb: "Three ribbed 8cm pots in navy, cream and terracotta. Drainage hole and rubber foot on each, saucer not included.", category: "merch" },
  { id: "m3", name: "PlantLuva Logo Tee", latin: "PlantLuva merch", mode: "sale", price: 90, img: "/img/potting-shop.jpg", seller: "dexter", region: "Chaguanas", size: "Medium", care: "Heavyweight cotton, screen print", light: "", blurb: "The shirt half the growers on this shelf wear to markets. Runs true to size, wash cold.", category: "merch" },
  { id: "m4", name: "Stainless Pruning Shears", latin: "PlantLuva merch", mode: "sale", price: 85, img: "/img/philodendron-black-bowl.jpg", seller: "shivani", region: "San Fernando", size: "One size", care: "Stainless steel, non-stick coating", light: "", blurb: "Sharp enough for a clean node cut, small enough for fussy aroids. Comes with a leather thumb strap.", category: "merch" },
  { id: "m5", name: "Moisture Meter", latin: "PlantLuva merch", mode: "sale", price: 45, img: "/img/monstera-corner.jpg", seller: "andre", region: "Tobago", size: "One size", care: "No batteries required", light: "", blurb: "Probe it to the root ball and it tells you dry, moist or wet, no more guessing with fussy plants.", category: "merch" },
  { id: "m6", name: "Organic Plant Food, 500ml", latin: "PlantLuva merch", mode: "sale", price: 55, img: "/img/fishbone-cactus.jpg", seller: "kavita", region: "Port of Spain", size: "500ml", care: "Concentrate, dilute 1:10", light: "", blurb: "Seaweed and fish emulsion mix, the one Kavita uses on everything from aroids to orchids. Lasts about three months.", category: "merch" },
];

export const MOCK_LISTINGS: ListingWithSeller[] = RAW.map((r, i) => ({
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
  images: galleryFor(r.img, i, r.category ?? "plant"),
  category: r.category ?? "plant",
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
