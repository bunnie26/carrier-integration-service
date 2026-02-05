import { RateRequest } from "./types";

function validateAddress(addr: { country?: unknown; postalCode?: unknown; city?: unknown }, name: string) {
  if (!addr || typeof addr !== "object") {
    throw new Error("invalid rate request");
  }
  if (typeof addr.country !== "string" || !addr.country.trim()) {
    throw new Error(`invalid rate request: ${name} country required`);
  }
  if (typeof addr.postalCode !== "string" || !addr.postalCode.trim()) {
    throw new Error(`invalid rate request: ${name} postalCode required`);
  }
  if (typeof addr.city !== "string" || !addr.city.trim()) {
    throw new Error(`invalid rate request: ${name} city required`);
  }
}

export function validateRateRequest(input: RateRequest) {
  if (!input.origin || !input.destination) {
    throw new Error("invalid rate request");
  }
  validateAddress(input.origin, "origin");
  validateAddress(input.destination, "destination");

  if (!Array.isArray(input.packages) || input.packages.length === 0) {
    throw new Error("at least one package is required");
  }

  for (const p of input.packages) {
    if (
      typeof p.weightKg !== "number" ||
      typeof p.lengthCm !== "number" ||
      typeof p.widthCm !== "number" ||
      typeof p.heightCm !== "number"
    ) {
      throw new Error("invalid package dimensions");
    }
  }
}
