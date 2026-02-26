import { User, Clock, Verified, Shield, Crown, LucideIcon } from "lucide-react"

export const Roles = {
  ELITE: "1234567890123456789",           // Replace with actual Discord Role ID
  TRUSTED: "1234567890123456789",         // Replace with actual Discord Role ID  
  VERIFIED: "1234567890123456789",        // ID & Selfie Verified - Replace with actual ID
  PENDING: "1234567890123456789",         // Pending Verification - Replace with actual ID
  BOOSTER: "1234567890123456789",         // Server Booster - Replace with actual ID
} as const

export type TrustLevel = "NEW" | "PENDING" | "VERIFIED" | "TRUSTED" | "ELITE"

export function getTrustFromRoles(roles: string[]): TrustLevel {
  if (roles.includes(Roles.ELITE)) return "ELITE"
  if (roles.includes(Roles.TRUSTED)) return "TRUSTED"
  if (roles.includes(Roles.VERIFIED)) return "VERIFIED"
  if (roles.includes(Roles.PENDING)) return "PENDING"
  return "NEW"
}

export const trustConfig: Record<TrustLevel, { 
  color: string
  bg: string
  icon: LucideIcon
  label: string 
}> = {
  "NEW": { 
    color: "text-zinc-400", 
    bg: "bg-zinc-500/10 border-zinc-500/20", 
    icon: User, 
    label: "New Member" 
  },
  "PENDING": { 
    color: "text-amber-400", 
    bg: "bg-amber-500/10 border-amber-500/20", 
    icon: Clock, 
    label: "Pending" 
  },
  "VERIFIED": { 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10 border-emerald-500/20", 
    icon: Verified, 
    label: "Verified" 
  },
  "TRUSTED": { 
    color: "text-blue-400", 
    bg: "bg-blue-500/10 border-blue-500/20", 
    icon: Shield, 
    label: "Trusted" 
  },
  "ELITE": { 
    color: "text-purple-400", 
    bg: "bg-purple-500/10 border-purple-500/20", 
    icon: Crown, 
    label: "Elite" 
  }
}