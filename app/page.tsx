"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/background"
import { Loading } from "@/components/ui/loading"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ExtendedSession } from "@/lib/auth/types"
import { getTrustFromRoles } from "@/lib/utils/trust"
import { NavBar } from "@/components/global/navbar"
import { Header } from "@/components/home/Header"
import { ActionGrid } from "@/components/home/ActionCard"
import { SuggestedMatches } from "@/components/home/SuggestedMatches"
import { StatsCard } from "@/components/home/StatsCard"
import { PremiumBanner } from "@/components/home/PremiumBanner"
import { ProfileCard } from "@/components/home/ProfileCard"
import { ActivityCard } from "@/components/home/ActivityCard"
import { Footer } from "@/components/home/Footer"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [dismissedPremium, setDismissedPremium] = useState(() => 
    typeof window !== 'undefined' && !!localStorage.getItem('dismissPremiumCTA')
  )

  if (status === "loading") return <Loading />
  if (!session) redirect("/")

  const s = session as ExtendedSession
  
  // Derive state from session
  const trustLevel = getTrustFromRoles(s.discord.guild.roles)
  const isVerified = trustLevel === "VERIFIED"
  const isOnline = new Date().getTime() - new Date(s.user.lastSeen).getTime() < 5 * 60 * 1000
  
  const profilePercent = s.profile.complete ? 100 : Math.min(100, (
    (s.profile.photos > 0 ? 1 : 0) +
    (!!s.profile.bio ? 1 : 0) +
    (!!s.user.age ? 1 : 0) +
    (s.profile.tags.length > 0 ? 1 : 0)
  ) / 4 * 100)

  const dismissPremium = () => {
    setDismissedPremium(true)
    localStorage.setItem('dismissPremiumCTA', 'true')
  }

  const unreadCount = (s.notifications?.filter(n => !n.read).length || 0) + s.stats.messages

  return (
    <AuroraBackground>
      <TooltipProvider delayDuration={100}>
        <NavBar 
          session={s} 
          trustLevel={trustLevel}
          isOnline={isOnline} 
          unreadCount={unreadCount} 
          onSignOut={() => signOut()} 
        />
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-6">
              <Header 
                user={s.user} 
                stats={s.stats} 
                trustLevel={trustLevel}
                isVerified={isVerified}
              />
              <ActionGrid actions={s.can} stats={s.stats} />
              
              {s.can.seek && s.suggestedMatches && s.suggestedMatches.length > 0 && (
                <SuggestedMatches matches={s.suggestedMatches} />
              )}
              
              <StatsCard stats={s.stats} />
              
              {!s.profile.boosted && !dismissedPremium && (
                <PremiumBanner onDismiss={dismissPremium} />
              )}
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              <ProfileCard 
                user={s.user} 
                profile={s.profile} 
                profilePercent={profilePercent} 
                isOnline={isOnline} 
              />
              <ActivityCard activities={s.recentActivities} />
              <Footer />
            </div>
          </motion.div>
        </main>
      </TooltipProvider>
    </AuroraBackground>
  )
}