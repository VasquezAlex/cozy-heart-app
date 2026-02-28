import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Users, MessageCircle, Lock, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExtendedSession } from "@/lib/auth/types/session"

interface ActionGridProps {
  actions: ExtendedSession["can"]
  stats: ExtendedSession["stats"]
}

export function ActionGrid({ actions, stats }: ActionGridProps) {
  const items = [
    { 
      icon: Search, 
      label: "Discover", 
      desc: actions.seek ? "Find your perfect match" : "Complete profile to unlock", 
      href: "/seeking", 
      color: "from-rose-500 via-pink-500 to-rose-600", 
      disabled: !actions.seek 
    },
    { 
      icon: Users, 
      label: "Matches", 
      desc: stats.matches === 0 ? "No connections yet" : `${stats.matches} connection${stats.matches !== 1 ? 's' : ''}`, 
      href: "/match-making", 
      color: "from-violet-500 via-purple-500 to-indigo-600", 
      badge: stats.matches 
    },
    { 
      icon: MessageCircle, 
      label: "Messages", 
      desc: stats.messages === 0 ? "No unread messages" : `${stats.messages} unread`, 
      href: "/messages", 
      color: "from-blue-500 via-cyan-500 to-blue-600", 
      badge: stats.messages, 
      disabled: !actions.message 
    },
  ]

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1 }} 
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {items.map((item) => (
        <Link 
          key={item.label} 
          href={item.disabled ? "#" : item.href} 
          className={item.disabled ? 'pointer-events-none' : ''}
        >
          <Card className={`relative overflow-hidden bg-zinc-950/50 border-white/8 hover:border-white/12 transition-all h-full group ${item.disabled ? 'opacity-60' : ''}`}>
            <div className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${item.color} shadow-lg flex items-center justify-center`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                {item.badge ? (
                  <Badge className="bg-white text-black font-bold border-0">{item.badge}</Badge>
                ) : item.disabled ? (
                  <Lock className="w-5 h-5 text-zinc-600" />
                ) : null}
              </div>
              <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                {item.label}
                {!item.disabled && (
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all" />
                )}
              </h3>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400">{item.desc}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </motion.section>
  )
}