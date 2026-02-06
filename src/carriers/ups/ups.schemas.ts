import { z } from "zod";

export const upsTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export type UpsTokenResponse = z.infer<typeof upsTokenResponseSchema>;

const upsRatedShipmentItemSchema = z.object({
  Service: z.object({ Code: z.string() }),
  TotalCharges: z.object({
    MonetaryValue: z.union([z.string(), z.number()]).transform((v) => Number(v)),
    CurrencyCode: z.string(),
  }),
  GuaranteedDelivery: z
    .object({ BusinessDaysInTransit: z.coerce.number() })
    .optional(),
});

export const upsRateResponseSchema = z.object({
  RateResponse: z.object({
    RatedShipment: z.array(upsRatedShipmentItemSchema),
  }),
});

export type UpsRateResponse = z.infer<typeof upsRateResponseSchema>;
