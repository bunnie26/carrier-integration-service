import axios from "axios";
import { UPS_BASE_URL, UPS_CLIENT_ID, UPS_CLIENT_SECRET } from "../../config/env";
import { CarrierError } from "../../core/errors";

let cache: { token: string; expiresAt: number } | null = null;

export async function getUpsToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now()) return cache.token;

  let res;
  try {
    res = await axios.post(
    `${UPS_BASE_URL}/security/v1/oauth/token`,
    "grant_type=client_credentials",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: UPS_CLIENT_ID, password: UPS_CLIENT_SECRET },
    }
  );
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown } };
    const status = axiosErr.response?.status;
    const data = axiosErr.response?.data;
    const msg =
      data && typeof data === "object" && typeof (data as Record<string, unknown>).message === "string"
        ? (data as Record<string, unknown>).message
        : status != null ? `HTTP ${status}` : "Token request failed";
    throw new CarrierError("token_request_failed", String(msg), status, "ups");
  }

  const accessToken = res.data?.access_token;
  const expiresIn = res.data?.expires_in;
  if (typeof accessToken !== "string" || typeof expiresIn !== "number") {
    throw new CarrierError("invalid_token_response", "Invalid token response", undefined, "ups");
  }
  cache = {
    token: accessToken,
    expiresAt: Date.now() + expiresIn * 1000 - 30_000,
  };
  return cache.token;
}

export function clearUpsTokenCache(): void {
  cache = null;
}
