import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Activity, Heart, Sparkles, Eye, Gift, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExtendedSession } from "@/lib/auth/types"
import { formatDate } from "@/lib/utils/trust"

interface ActivityCardProps {
  activities?: ExtendedSession["recentActivities"]
}

export function ActivityCard({ activities }: ActivityCardProps) {
  const router = useRouter()
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-zinc-950/50 border-white/8">
        <CardHeader className="pb-4 border-b border-white/6">
          <CardTitle className="text-white text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 4).map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                  onClick={() => activity.type === 'match' && router.push(`/match-making`)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === 'match' ? 'bg-rose-500/20 text-rose-400' :
                    activity.type === 'like' ? 'bg-pink-500/20 text-pink-400' :
                    activity.type === 'view' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {activity.type === 'match' ? <Heart className="w-5 h-5" /> :
                     activity.type === 'like' ? <Sparkles className="w-5 h-5" /> :
                     activity.type === 'view' ? <Eye className="w-5 h-5" /> :
                     <Gift className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{activity.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{activity.description}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{formatDate(activity.timestamp)}</p>
                  </div>
                  {!activity.read && <div className="w-2 h-2 bg-rose-500 rounded-full mt-2" />}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Inbox className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}