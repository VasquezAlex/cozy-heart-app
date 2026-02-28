import crypto from "crypto";

function getBaseUrl() {
  const value = process.env.API_URL || "http://localhost:3000";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildSignedHeaders(body: string) {
  const signingSecret = process.env.SIGNING_SECRET;
  const apiKey = process.env.API_KEY;

  if (!signingSecret || !apiKey) {
    throw new Error("Missing API_KEY or SIGNING_SECRET for signed API call");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hash = crypto.createHash("sha256").update(body).digest("hex");
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(`${timestamp}:${hash}`)
    .digest("hex");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Request-Timestamp": timestamp,
    "X-Body-Hash": hash,
    "X-Signature": signature,
  };
}

export async function APICall<T = Record<string, unknown>>(path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload || {});
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: buildSignedHeaders(body),
    body,
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = { error: "Invalid JSON response from API" };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `API request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
