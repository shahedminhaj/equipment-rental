export type EquipmentListing = {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  price: number;
  rentalType: "Daily" | "Weekly" | "Monthly";
  availableQuantity: number;
  image: string;
  condition?: string;
  brand?: string;
  model?: string;
  rentalTerms?: string[];
  createdAt?: string;
  owner?: {
    name?: string;
    photo?: string;
    email?: string;
  } | null;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to the server. Please check that the backend is running and NEXT_PUBLIC_API_URL is correct.",
      );
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The API returned an invalid response");
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `The request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export function formatCurrency(amount: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function rentalPeriod(type: EquipmentListing["rentalType"]) {
  if (type === "Daily") return "day";
  if (type === "Weekly") return "week";
  return "month";
}
