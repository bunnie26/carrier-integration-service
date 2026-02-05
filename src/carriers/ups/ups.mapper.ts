import { RateRequest } from "../../core/types";

export function toUpsRateRequest(req: RateRequest) {
  return {
    RateRequest: {
      Shipment: {
        ShipFrom: {
          Address: {
            PostalCode: req.origin.postalCode,
            CountryCode: req.origin.country,
            City: req.origin.city,
          },
        },
        ShipTo: {
          Address: {
            PostalCode: req.destination.postalCode,
            CountryCode: req.destination.country,
            City: req.destination.city,
          },
        },
        Package: req.packages.map(p => ({
          Dimensions: {
            UnitOfMeasurement: { Code: "CM" },
            Length: p.lengthCm,
            Width: p.widthCm,
            Height: p.heightCm,
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: "KGS" },
            Weight: p.weightKg,
          },
        })),
      },
    },
  };
}
