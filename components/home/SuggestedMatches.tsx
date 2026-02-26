import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Sparkles, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExtendedSession } from "@/lib/auth/types"

interface SuggestedMatchesProps {
  matches: ExtendedSession["suggestedMatches"]
}

export function SuggestedMatches({ matches }: SuggestedMatchesProps) {
  const router = useRouter()
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-zinc-950/50 border-white/8">
        <CardHeader className="pb-4 border-b border-white/6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Suggested for You
              </CardTitle>
              <CardDescription className="text-zinc-500 mt-1">
                Based on your preferences
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" asChild>
              <Link href="/seeking">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {matches?.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="shrink-0 w-48 group cursor-pointer"
                onClick={() => router.push(`/profile/${match.id}`)}
              >
                <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-rose-500/50 transition-colors">
                  <Image 
                    src={match.avatar} 
                    alt={match.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">{match.name}, {match.age}</h3>
                      <Badge className="bg-rose-500/20 text-rose-300 text-xs border-0">
                        {match.matchPercentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {match.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}