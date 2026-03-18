const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const DATABASE_ID = process.env.D1_DATABASE_ID!;

const D1_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: { changes: number; last_row_id: number; rows_read: number; rows_written: number };
}

interface D1Response<T = Record<string, unknown>> {
  result: D1Result<T>[];
  success: boolean;
  errors: { code: number; message: string }[];
}

async function d1Fetch<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<D1Result<T>> {
  const res = await fetch(`${D1_BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API error ${res.status}: ${text}`);
  }

  const data: D1Response<T> = await res.json();
  if (!data.success) {
    throw new Error(`D1 query failed: ${data.errors.map((e) => e.message).join(", ")}`);
  }

  return data.result[0];
}

/** Run a SELECT query and return rows. */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await d1Fetch<T>(sql, params);
  return result.results;
}

/** Run an INSERT / UPDATE / DELETE and return metadata. */
export async function d1Execute(
  sql: string,
  params: unknown[] = [],
): Promise<{ changes: number; lastRowId: number }> {
  const result = await d1Fetch(sql, params);
  return { changes: result.meta.changes, lastRowId: result.meta.last_row_id };
}
