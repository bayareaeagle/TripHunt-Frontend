/**
 * Cloudflare API authentication helper.
 *
 * Supports two auth modes:
 *   1. Scoped API token (preferred): `Authorization: Bearer <token>`
 *   2. Global API Key: `X-Auth-Email: <email>` + `X-Auth-Key: <key>`
 *
 * The mode is selected by presence of `CLOUDFLARE_EMAIL` — if set, Global
 * API Key mode is used; otherwise we fall back to Bearer.
 */
export function cfAuthHeaders(): Record<string, string> {
  const email = process.env.CLOUDFLARE_EMAIL;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is not set");
  }
  if (email) {
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": token,
    };
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}
