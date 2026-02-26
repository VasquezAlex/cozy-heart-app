import { User, Verified, LucideIcon } from "lucide-react"

export const Roles = {
  verified: "1426055322111443004",        
  booster: "1424016449747423343",        
} as const

export type TrustLevel = "NEW" | "VERIFIED"

export function getTrustFromRoles(roles: string[]): TrustLevel {
  if (roles.includes(Roles.verified)) return "VERIFIED"
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
  "VERIFIED": { 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10 border-emerald-500/20", 
    icon: Verified, 
    label: "Verified" 
  }
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return "Yesterday"
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}