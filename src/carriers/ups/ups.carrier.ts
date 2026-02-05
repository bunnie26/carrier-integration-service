import axios, { AxiosError } from "axios";
import { Carrier } from "../../core/carrier.interface";
import { RateRequest, RateQuote } from "../../core/types";
import { getUpsToken, clearUpsTokenCache } from "./ups.auth";
import { toUpsRateRequest } from "./ups.mapper";
import { UPS_BASE_URL } from "../../config/env";

function normalizeRateResponse(data: unknown): RateQuote[] {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid rate response");
  }
  const obj = data as Record<string, unknown>;
  const rateResponse = obj.RateResponse;
  if (!rateResponse || typeof rateResponse !== "object") {
    throw new Error("Invalid rate response");
  }
  const ratedShipment = (rateResponse as Record<string, unknown>).RatedShipment;
  if (!Array.isArray(ratedShipment)) {
    throw new Error("Invalid rate response");
  }
  return ratedShipment.map((r: unknown) => {
    if (!r || typeof r !== "object") throw new Error("Invalid rate response");
    const row = r as Record<string, unknown>;
    const service = row.Service as Record<string, unknown> | undefined;
    const totalCharges = row.TotalCharges as Record<string, unknown> | undefined;
    const guaranteedDelivery = row.GuaranteedDelivery as Record<string, unknown> | undefined;
    const code = service?.Code;
    const monetaryValue = totalCharges?.MonetaryValue;
    const currencyCode = totalCharges?.CurrencyCode;
    if (code == null || monetaryValue == null || currencyCode == null) {
      throw new Error("Invalid rate response");
    }
    return {
      carrier: "ups" as const,
      service: String(code),
      amount: Number(monetaryValue),
      currency: String(currencyCode),
      deliveryDays:
        guaranteedDelivery?.BusinessDaysInTransit != null
          ? Number(guaranteedDelivery.BusinessDaysInTransit)
          : undefined,
    };
  });
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
    } catch (err) {
      const axiosErr = err as AxiosError<unknown>;
      if (axiosErr.response?.status === 401) {
        clearUpsTokenCache();
        const newToken = await getUpsToken();
        const retryRes = await axios.post(url, payload, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        return normalizeRateResponse(retryRes.data);
      }
      if (axiosErr.response?.data != null) {
        const data = axiosErr.response.data as Record<string, unknown>;
        const msg =
          typeof data.message === "string" ? data.message : `HTTP ${axiosErr.response.status}`;
        throw new Error(String(msg));
      }
      if (axiosErr.response?.status != null) {
        throw new Error(`HTTP ${axiosErr.response.status}`);
      }
      throw err;
    }
  }
}
