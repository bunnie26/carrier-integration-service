import axios, { AxiosError } from "axios";
import { UPS_BASE_URL, UPS_CLIENT_ID, UPS_CLIENT_SECRET } from "../../config/env";
import { CarrierError, getHttpErrorMessage } from "../../core/errors";
import { upsTokenResponseSchema } from "./ups.schemas";

let cache: { token: string; expiresAt: number } | null = null;

export async function getUpsToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now()) return cache.token;

  let response: { data: unknown };
  try {
    response = await axios.post(
      `${UPS_BASE_URL}/security/v1/oauth/token`,
      "grant_type=client_credentials",
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: UPS_CLIENT_ID, password: UPS_CLIENT_SECRET },
      }
    );
  } catch (err: unknown) {
    const status = err instanceof AxiosError ? err.response?.status : undefined;
    const data = err instanceof AxiosError ? err.response?.data : undefined;
    const msg = getHttpErrorMessage(
      data,
      status != null ? `HTTP ${status}` : "Token request failed"
    );
    throw new CarrierError("token_request_failed", msg, status, "ups");
  }

  const parsed = upsTokenResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new CarrierError(
      "invalid_token_response",
      "Invalid token response",
      undefined,
      "ups"
    );
  }

  const { access_token, expires_in } = parsed.data;
  cache = {
    token: access_token,
    expiresAt: Date.now() + expires_in * 1000 - 30_000,
  };
  return cache.token;
}

export function clearUpsTokenCache(): void {
  cache = null;
}
