import { NextResponse } from "next/server"
import crypto from "crypto"

const requests = new Map<string, number[]>()
const MAX_STORED_IPS = 1000

export function authenticateRequest(req: Request) {
  if (!req?.headers) {
    throw new Error("Invalid request object")
  }

  const ip = getIP(req)

  if (isBlockedIP(ip)) throw new Error("IP not allowed")
  if (isRateLimited(ip)) throw new Error("Too many requests")
  if (isExpired(req)) throw new Error("Request too old")
  if (isWrongKey(req)) throw new Error("Wrong API key")
  if (isTampered(req)) throw new Error("Invalid signature")

  return { ip, requestId: crypto.randomUUID() }
}

function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
}

function isBlockedIP(ip: string) {
  const allowed = process.env.ALLOWED_IPS?.split(",") || []
  return allowed.length > 0 && !allowed.includes(ip)
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const recent = (requests.get(ip) || []).filter((t) => now - t < 60000)

  if (recent.length >= 20) return true

  recent.push(now)
  requests.set(ip, recent)

  if (requests.size > MAX_STORED_IPS) {
    const firstKey = requests.keys().next().value
    if (firstKey) {
      requests.delete(firstKey)
    }
  }

  return false
}

function isExpired(req: Request) {
  const ts = req.headers.get("x-request-timestamp")

  if (!ts) return true

  return Math.abs(Date.now() / 1000 - parseInt(ts, 10)) > 300
}

function isWrongKey(req: Request) {
  const key = req.headers.get("authorization")?.replace("Bearer ", "") || ""
  const valid = [process.env.API_KEY, process.env.API_KEY_FALLBACK].filter(
    (value): value is string => Boolean(value)
  )

  if (!valid.length) return true

  return !valid.some((candidate) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(candidate))
    } catch {
      return false
    }
  })
}

function isTampered(req: Request) {
  const ts = req.headers.get("x-request-timestamp") || ""
  const hash = req.headers.get("x-body-hash") || ""
  const sig = req.headers.get("x-signature") || ""
  const signingSecret = process.env.SIGNING_SECRET

  if (!signingSecret) return true

  const expected = crypto
    .createHmac("sha256", signingSecret)
    .update(`${ts}:${hash}`)
    .digest("hex")

  try {
    return !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return true
  }
}

export function deny(message: string, requestId?: string) {
  return NextResponse.json(
    { success: false, error: message, requestId: requestId || "none" },
    { status: 401 }
  )
}
