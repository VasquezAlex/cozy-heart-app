import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Verified } from "lucide-react"
import { ExtendedSession } from "@/lib/auth/types"
import { TrustLevel, trustConfig } from "@/lib/utils/trust"

interface HeaderProps {
  user: ExtendedSession["user"]
  stats: ExtendedSession["stats"]
  trustLevel: TrustLevel
  isVerified: boolean
}

export function Header({ user, stats, trustLevel, isVerified }: HeaderProps) {
  const trustStyle = trustConfig[trustLevel]
  const TrustIcon = trustStyle.icon

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge 
          variant="outline" 
          className={`${trustStyle.bg} ${trustStyle.color} border backdrop-blur-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wide`}
        >
          <TrustIcon className="w-3.5 h-3.5 mr-1.5" />
          {trustStyle.label}
        </Badge>
        
        {isVerified && (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 backdrop-blur-sm px-3 py-1.5">
            <Verified className="w-3.5 h-3.5 mr-1.5" />
            ID Verified
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          <span className="text-zinc-500">Welcome back,</span>
          <br />
          <span className="bg-linear-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            {user.name}
          </span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-2xl">
          {stats.matches > 0 || stats.messages > 0 ? (
            <>
              You have{" "}
              <span className="text-rose-400 font-semibold">
                {stats.matches} match{stats.matches !== 1 ? 'es' : ''}
              </span>
              {" "}and{" "}
              <span className="text-blue-400 font-semibold">
                {stats.messages} message{stats.messages !== 1 ? 's' : ''}
              </span>
              {" "}waiting.
            </>
          ) : (
            <span className="text-zinc-500">
              Complete your profile to connect with amazing people.
            </span>
          )}
        </p>
      </div>
    </motion.section>
  )
}