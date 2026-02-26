import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, Check, X, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PremiumBannerProps {
  onDismiss: () => void
}

export function PremiumBanner({ onDismiss }: PremiumBannerProps) {
  const router = useRouter()
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.4 }}
    >
      <Card className="relative overflow-hidden bg-linear-to-br from-rose-500/20 via-purple-500/20 to-violet-500/20 border-rose-500/30">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 text-zinc-300 hover:text-white hover:bg-white/10 z-20" 
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/30 rounded-full blur-3xl" />
        <CardContent className="relative p-8 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <Badge className="bg-white/20 text-white border-white/20 mb-2">
                <Crown className="w-3 h-3 mr-1.5" /> Premium
              </Badge>
              <h2 className="text-3xl font-bold text-white">Boost Your Profile</h2>
              <p className="text-zinc-200">
                Get seen by 10x more people. Premium members get 5x more matches on average.
              </p>
              <div className="flex items-center gap-4 text-sm text-zinc-200 pt-2">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-400" /> Priority listing
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-400" /> Unlimited likes
                </span>
              </div>
            </div>
            <Button 
              className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-6 rounded-xl shadow-2xl"
              onClick={() => router.push('/premium')}
            >
              <Zap className="w-4 h-4 mr-2 fill-black" />
              Get Boost
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}