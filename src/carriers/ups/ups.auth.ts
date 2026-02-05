import axios from "axios";
import { UPS_BASE_URL, UPS_CLIENT_ID, UPS_CLIENT_SECRET } from "../../config/env";

let cache: { token: string; expiresAt: number } | null = null;

export async function getUpsToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now()) return cache.token;

  const res = await axios.post(
    `${UPS_BASE_URL}/security/v1/oauth/token`,
    "grant_type=client_credentials",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: UPS_CLIENT_ID, password: UPS_CLIENT_SECRET },
    }
  );

  const accessToken = res.data?.access_token;
  const expiresIn = res.data?.expires_in;
  if (typeof accessToken !== "string" || typeof expiresIn !== "number") {
    throw new Error("Invalid token response");
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
