"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/background"
import { Loading } from "@/components/ui/loading"
import { NavBar } from "@/components/global/navbar"
import { ExtendedSession } from "@/lib/auth/types"
import { getTrustFromRoles } from "@/lib/utils/trust"
import { SeekingProfile } from "@/lib/seeking/types"

export default function SeekingPage() {
  const { data: session, status } = useSession()
  const [profiles, setProfiles] = useState<SeekingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch profiles on mount
  useEffect(() => {
    if (status !== "authenticated") return

    async function loadProfiles() {
      try {
        const res = await fetch('/api/seeking')
        if (!res.ok) throw new Error("Failed to load")
        
        const data = await res.json()
        setProfiles(data.profiles || [])
      } catch (err) {
        setError("Could not load profiles")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [status])

  if (status === "loading") return <Loading />
  if (!session) redirect("/")

  const s = session as ExtendedSession
  const trustLevel = getTrustFromRoles(s.discord.guild.roles)
  const isOnline = new Date().getTime() - new Date(s.user.lastSeen).getTime() < 5 * 60 * 1000
  const unreadCount = (s.notifications?.filter(n => !n.read).length || 0) + s.stats.messages

  return (
    <AuroraBackground>
      <NavBar 
        session={s} 
        trustLevel={trustLevel}
        isOnline={isOnline} 
        unreadCount={unreadCount} 
        onSignOut={() => {}} 
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold text-white">Discover</h1>
          
          {loading ? (
            <Loading text="Finding people..." />
          ) : error ? (
            <div className="text-red-400 text-center py-20">{error}</div>
          ) : profiles.length === 0 ? (
            <div className="text-zinc-400 text-center py-20">
              No profiles found. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-950/50 border border-white/8 rounded-2xl p-4 hover:border-white/12 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/profile/${profile.userId}`}
                >
                  {/* Simple card layout - replace with ProfileCard component later */}
                  <div className="aspect-square bg-zinc-900 rounded-xl mb-4 overflow-hidden relative">
                    {profile.photos && profile.photos[0] ? (
                      <Image 
                        src={profile.photos[0]} 
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        No Photo
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">
                      {profile.name}, {profile.age}
                    </h3>
                    {profile.verified && (
                      <span className="text-emerald-400 text-xs">✓</span>
                    )}
                  </div>
                  
                  {profile.region && (
                    <p className="text-sm text-zinc-400 mb-2">{profile.region}</p>
                  )}
                  
                  {profile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs bg-white/5 text-zinc-300 px-2 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </AuroraBackground>
  )
}