import axios, { AxiosError } from "axios";
import { Carrier } from "../../core/carrier.interface";
import { RateRequest, RateQuote } from "../../core/types";
import { CarrierError, getHttpErrorMessage } from "../../core/errors";
import { getUpsToken, clearUpsTokenCache } from "./ups.auth";
import { toUpsRateRequest } from "./ups.mapper";
import { upsRateResponseSchema } from "./ups.schemas";
import { UPS_BASE_URL } from "../../config/env";

function normalizeRateResponse(data: unknown): RateQuote[] {
  const parsed = upsRateResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new CarrierError(
      "invalid_rate_response",
      "Invalid rate response",
      undefined,
      "ups"
    );
  }

  return parsed.data.RateResponse.RatedShipment.map((r): RateQuote => ({
    carrier: "ups",
    service: r.Service.Code,
    amount: r.TotalCharges.MonetaryValue,
    currency: r.TotalCharges.CurrencyCode,
    deliveryDays: r.GuaranteedDelivery?.BusinessDaysInTransit,
  }));
}

export class UpsCarrier implements Carrier {
  async getRates(req: RateRequest): Promise<RateQuote[]> {
    const token = await getUpsToken();
    const payload = toUpsRateRequest(req);
    const url = `${UPS_BASE_URL}/api/rating/v2409/Shop`;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.post(url, payload, config);
      return normalizeRateResponse(res.data);
    } catch (err: unknown) {
      if (!(err instanceof AxiosError)) {
        throw new CarrierError(
          "carrier_error",
          err instanceof Error ? err.message : "Request failed",
          undefined,
          "ups"
        );
      }

      if (err.response?.status === 401) {
        clearUpsTokenCache();
        const newToken = await getUpsToken();
        const retryRes = await axios.post(url, payload, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        return normalizeRateResponse(retryRes.data);
      }

      const status = err.response?.status;
      const msg = getHttpErrorMessage(
        err.response?.data,
        status != null ? `HTTP ${status}` : "Request failed"
      );
      throw new CarrierError("carrier_error", msg, status, "ups");
    }
  }
}
