import { RateRequest } from "./types";

export function validateRateRequest(input: RateRequest) {
  if (!input.origin || !input.destination) {
    throw new Error("invalid rate request");
  }

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
