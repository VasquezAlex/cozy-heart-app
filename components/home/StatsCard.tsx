import { motion } from "framer-motion"
import { TrendingUp, Eye, Heart, MessageCircle, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExtendedSession } from "@/lib/auth/types"

interface StatsCardProps {
  stats: ExtendedSession["stats"]
}

export function StatsCard({ stats }: StatsCardProps) {
  const items = [
    { label: "Profile Views", value: stats.views, icon: Eye, color: "text-rose-400" },
    { label: "Matches", value: stats.matches, icon: Heart, color: "text-pink-400" },
    { label: "Messages", value: stats.messages, icon: MessageCircle, color: "text-blue-400" },
    { label: "Likes Received", value: stats.likes, icon: Sparkles, color: "text-amber-400" },
  ]

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-zinc-950/50 border-white/8">
        <CardHeader className="pb-4 border-b border-white/6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg font-semibold">Your Stats</CardTitle>
              <CardDescription className="text-zinc-500 mt-1">
                {stats.score > 0 ? `Popularity Score: ${stats.score}/100` : 'Complete your profile to boost visibility'}
              </CardDescription>
            </div>
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-white/3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 space-y-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}