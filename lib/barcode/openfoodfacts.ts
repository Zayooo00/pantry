export type OffProduct = {
  name: string;
  brand: string | null;
  imageUrl: string | null;
  quantity: string | null;
};

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,brands,image_front_url,image_url,quantity";
const TIMEOUT_MS = 4000;

type OffApiResponse = {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_url?: string;
    image_url?: string;
    quantity?: string;
  };
};

export async function fetchOffProduct(code: string): Promise<OffProduct | null> {
  const fixture = readFixture(code);
  if (fixture !== undefined) {
    return fixture;
  }
  const url = `${OFF_BASE}/${encodeURIComponent(code)}.json?fields=${FIELDS}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let json: OffApiResponse;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": buildUserAgent() },
    });
    if (!res.ok) {
      return null;
    }
    json = (await res.json()) as OffApiResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (json.status !== 1 || !json.product) {
    return null;
  }
  const name = (json.product.product_name ?? "").trim();
  if (!name) {
    return null;
  }
  const brand = json.product.brands ? json.product.brands.split(",")[0].trim() || null : null;
  const imageUrl = json.product.image_front_url || json.product.image_url || null;
  const quantity = json.product.quantity?.trim() || null;
  return { name, brand, imageUrl, quantity };
}

function buildUserAgent(): string {
  const contact = process.env.APP_URL?.trim();
  return contact ? `Pantry/0.1 (${contact})` : "Pantry/0.1";
}

function readFixture(code: string): OffProduct | null | undefined {
  const raw = process.env.E2E_OFF_FIXTURES;
  if (!raw) {
    return undefined;
  }
  let map: Record<string, OffProduct | null>;
  try {
    map = JSON.parse(raw) as Record<string, OffProduct | null>;
  } catch (err) {
    console.warn("E2E_OFF_FIXTURES is not valid JSON; ignoring", err);
    return undefined;
  }
  if (!(code in map)) {
    return undefined;
  }
  return map[code];
}
