import { z } from "zod"

export const seekingSchema = z.object({
  action: z.enum(["like", "pass", "superlike"]),
  targetId: z.string().min(1, "Target ID required"),
})

export const seekingPostSchema = z.object({
  headline: z.string().min(5, "Headline must be at least 5 characters").max(80, "Headline is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(500, "Message is too long"),
  lookingFor: z.enum(["friends", "dating", "serious", "gaming", "chat"]).default("friends"),
  minAge: z.number().int().min(18).max(99).optional(),
  maxAge: z.number().int().min(18).max(99).optional(),
  availability: z.string().max(80, "Availability is too long").optional(),
  dealBreakers: z.string().max(180, "Deal-breakers is too long").optional(),
  region: z.string().min(2, "Region is required").max(100, "Region is too long").optional(),
  tags: z.array(z.string().min(1).max(24)).max(8, "Max 8 tags").default([]),
})

export const verifySchema = z.object({
  age: z.number().min(18).max(120),
  location: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
})

export const verifyRequestSchema = z.object({
  DeviceData: z.union([
    z.string().min(1),
    z.array(z.string()),
    z.record(z.string(), z.unknown()),
  ]),
  Consent: z
    .object({
      device: z.boolean(),
      ip: z.boolean(),
      timestamp: z.string().optional(),
    })
    .optional(),
  userId: z.string().optional(),
})

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false as const,
      error: result.error.issues[0]?.message || "Invalid input",
    }
  }

  return {
    success: true as const,
    data: result.data,
  }
}
