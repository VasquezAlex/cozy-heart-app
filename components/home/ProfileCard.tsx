import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Camera, FileText, Calendar, Sparkles, Check 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  HoverCard, HoverCardContent, HoverCardTrigger 
} from "@/components/ui/hover-card"
import { ExtendedSession } from "@/lib/auth/types"
import { formatDate } from "@/lib/utils/trust"

interface ProfileCardProps {
  user: ExtendedSession["user"]
  profile: ExtendedSession["profile"]
  profilePercent: number
  isOnline: boolean
}

export function ProfileCard({ user, profile, profilePercent, isOnline }: ProfileCardProps) {
  const router = useRouter()
  
  const completionSteps = [
    { label: "Add Photos", complete: profile.photos > 0, icon: Camera },
    { label: "Write Bio", complete: !!profile.bio, icon: FileText },
    { label: "Verify Age", complete: !!user.age, icon: Calendar },
    { label: "Add Tags", complete: profile.tags.length > 0, icon: Sparkles }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-zinc-950/50 border-white/8 overflow-hidden">
        <div className="h-1 w-full bg-linear-to-r from-rose-500 via-pink-500 to-violet-500" />
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div 
                  className="relative cursor-pointer" 
                  onClick={() => router.push('/profile')}
                >
                  <Avatar className="w-16 h-16 border-2 border-white/10 rounded-2xl">
                    <AvatarImage src={user.avatar} className="rounded-2xl" />
                    <AvatarFallback className="bg-linear-to-br from-rose-500 to-violet-600 text-white text-xl rounded-2xl">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-[#0a0a0f]" />
                  )}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 bg-[#13131a] border-white/8 text-white p-4 rounded-2xl">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 rounded-xl">
                    <AvatarImage src={user.avatar} className="rounded-xl" />
                    <AvatarFallback className="rounded-xl">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-white">{user.name}</h4>
                    <p className="text-sm text-zinc-500">{user.handle}</p>
                    <div className="flex items-center gap-2 pt-2 text-xs text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(user.joined)}
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg truncate">{user.name}</h3>
              <p className="text-sm text-zinc-500">
                {profile.complete ? "Profile Complete" : `${Math.round(profilePercent)}% Complete`}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                <span className="bg-white/6 px-2 py-1 rounded-md">{profile.photos} photos</span>
                {user.location && (
                  <span className="bg-white/6 px-2 py-1 rounded-md">{user.location}</span>
                )}
              </div>
            </div>
          </div>
          
          {!profile.complete && (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Profile Strength</span>
                <span className="text-zinc-200 font-medium">{Math.round(profilePercent)}%</span>
              </div>
              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-linear-to-r from-rose-500 to-violet-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profilePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="space-y-2 mt-4">
                {completionSteps.map((step) => (
                  <div 
                    key={step.label} 
                    className={`flex items-center gap-2 text-xs ${step.complete ? 'text-emerald-400' : 'text-zinc-500'}`}
                  >
                    {step.complete ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-zinc-600" />
                    )}
                    <step.icon className="w-3 h-3" />
                    <span className={step.complete ? 'line-through opacity-60' : ''}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-11" 
            onClick={() => router.push('/profile')}
          >
            {profile.complete ? 'Edit Profile' : 'Complete Profile'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}