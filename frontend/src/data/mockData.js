// Mock data — shaped the way we expect routes/brands.py to eventually respond.
// Swap this out once the backend is live; see src/lib/api.js.

export const mockBrands = [
  {
    id: "brand-1",
    name: "Zepto",
    category: "Quick Commerce",
    sentimentScore: 62, // 0-100, 50 = neutral baseline
    mentionCount: 1284,
    trend: "up", // "up" | "down" | "flat"
    trendDelta: 4.2,
    competitors: ["brand-2", "brand-3"],
  },
  {
    id: "brand-2",
    name: "Blinkit",
    category: "Quick Commerce",
    sentimentScore: 71,
    mentionCount: 2093,
    trend: "up",
    trendDelta: 1.8,
    competitors: ["brand-1", "brand-3"],
  },
  {
    id: "brand-3",
    name: "Swiggy Instamart",
    category: "Quick Commerce",
    sentimentScore: 48,
    mentionCount: 1567,
    trend: "down",
    trendDelta: -3.1,
    competitors: ["brand-1", "brand-2"],
  },
];

// 14-day sentiment trend for the active brand
export const mockTrend = [
  { date: "Jul 12", score: 55 },
  { date: "Jul 13", score: 57 },
  { date: "Jul 14", score: 54 },
  { date: "Jul 15", score: 59 },
  { date: "Jul 16", score: 63 },
  { date: "Jul 17", score: 60 },
  { date: "Jul 18", score: 64 },
  { date: "Jul 19", score: 66 },
  { date: "Jul 20", score: 61 },
  { date: "Jul 21", score: 65 },
  { date: "Jul 22", score: 68 },
  { date: "Jul 23", score: 64 },
  { date: "Jul 24", score: 62 },
  { date: "Jul 25", score: 62 },
];

// Aspect-level sentiment breakdown (from spaCy aspect extraction)
export const mockAspects = [
  { aspect: "Delivery speed", positive: 68, negative: 12, neutral: 20 },
  { aspect: "Pricing", positive: 34, negative: 41, neutral: 25 },
  { aspect: "App experience", positive: 55, negative: 18, neutral: 27 },
  { aspect: "Customer support", positive: 29, negative: 47, neutral: 24 },
  { aspect: "Product quality", positive: 60, negative: 15, neutral: 25 },
];

// Recent Reddit mentions (from PRAW scraping layer)
export const mockMentions = [
  {
    id: "m1",
    source: "r/india",
    author: "u/throwaway_shopper",
    text: "Zepto's 10 min delivery actually works in my area now, genuinely impressed with the consistency lately.",
    sentiment: "positive",
    timestamp: "2h ago",
  },
  {
    id: "m2",
    source: "r/bangalore",
    author: "u/kaveri_b",
    text: "Prices on Zepto have crept up a lot compared to last year, not sure it's worth it over the local store anymore.",
    sentiment: "negative",
    timestamp: "5h ago",
  },
  {
    id: "m3",
    source: "r/mumbai",
    author: "u/rahul_verma",
    text: "Ordered groceries, delivery was fine, nothing special either way.",
    sentiment: "neutral",
    timestamp: "9h ago",
  },
  {
    id: "m4",
    source: "r/india",
    author: "u/priya_k",
    text: "Customer support took forever to respond about a missing item, pretty frustrating experience overall.",
    sentiment: "negative",
    timestamp: "1d ago",
  },
];