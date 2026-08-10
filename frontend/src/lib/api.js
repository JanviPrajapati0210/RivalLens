// Thin API layer. Right now USE_MOCK is true because the backend isn't built yet.
// Once routes/brands.py etc. exist, flip USE_MOCK to false — every function below
// already has the real fetch() call written, just currently short-circuited.

import { mockBrands, mockTrend, mockAspects, mockMentions } from "../data/mockData";

const USE_MOCK = false;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getBrands() {
  if (USE_MOCK) {
    await delay(300);
    return mockBrands;
  }
  const res = await fetch(`${BASE_URL}/brands`);
  if (!res.ok) throw new Error("Failed to load brands");
  return res.json();
}

export async function getBrandTrend(brandId) {
  if (USE_MOCK) {
    await delay(300);
    return mockTrend;
  }
  const res = await fetch(`${BASE_URL}/brands/${brandId}/trend`);
  if (!res.ok) throw new Error("Failed to load trend");
  return res.json();
}

export async function getBrandAspects(brandId) {
  if (USE_MOCK) {
    await delay(300);
    return mockAspects;
  }
  const res = await fetch(`${BASE_URL}/brands/${brandId}/aspects`);
  if (!res.ok) throw new Error("Failed to load aspects");
  return res.json();
}

export async function getBrandMentions(brandId) {
  if (USE_MOCK) {
    await delay(300);
    return mockMentions;
  }
  const res = await fetch(`${BASE_URL}/brands/${brandId}/mentions`);
  if (!res.ok) throw new Error("Failed to load mentions");
  return res.json();
}

export async function addBrand({ name, category, competitorNames }) {
  if (USE_MOCK) {
    await delay(500);
    return {
      id: `brand-${Date.now()}`,
      name,
      category,
      sentimentScore: 50,
      mentionCount: 0,
      trend: "flat",
      trendDelta: 0,
      competitors: [],
      competitorNames,
    };
  }
  const res = await fetch(`${BASE_URL}/brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category, competitorNames }),
  });
  if (!res.ok) throw new Error("Failed to add brand");
  return res.json();
}

export async function triggerIngestion(brandId) {
  if (USE_MOCK) {
    await delay(400);
    return { status: "ingestion_started", brand_id: brandId };
  }
  const res = await fetch(`${BASE_URL}/brands/${brandId}/ingest`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start ingestion");
  return res.json();
}