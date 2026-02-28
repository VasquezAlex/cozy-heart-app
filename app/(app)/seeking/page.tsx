"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/layout/background"
import { Loading } from "@/components/ui/loading"
import { NavBar } from "@/components/layout/navbar"
import { ExtendedSession } from "@/lib/auth/types/session"
import { SeekingProfile } from "./types"
import { SeekingPostForm } from "./components/seeking-post-form"
import { SeekingProfilesGrid } from "./components/seeking-profiles-grid"

export default function SeekingPage() {
  const router = useRouter()
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/")
    }
  }, [status, router])

  if (status === "loading" || status === "unauthenticated" || !session) {
    return <Loading />
  }

  const s = session as ExtendedSession
  const trustLevel = s.user.trust
  const isOnline = new Date().getTime() - new Date(s.user.lastSeen).getTime() < 5 * 60 * 1000
  const unreadCount = (s.notifications?.filter(n => !n.read).length || 0) + s.stats.messages

  return (
    <AuroraBackground>
      <NavBar
        session={s}
        trustLevel={trustLevel}
        isOnline={isOnline}
        unreadCount={unreadCount}
        onSignOut={() => signOut({ callbackUrl: "/" })}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <SeekingPostForm />

          <SeekingProfilesGrid
            loading={loading}
            error={error}
            profiles={profiles}
            onOpenProfile={(userId) => router.push(`/profile/${userId}`)}
          />
        </motion.div>
      </main>
    </AuroraBackground>
  )
}