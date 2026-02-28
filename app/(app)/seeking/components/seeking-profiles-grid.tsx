"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Loading } from "@/components/ui/loading"
import type { SeekingProfile } from "../types"

type SeekingProfilesGridProps = {
  loading: boolean
  error: string
  profiles: SeekingProfile[]
  onOpenProfile: (userId: string) => void
}

export function SeekingProfilesGrid({ loading, error, profiles, onOpenProfile }: SeekingProfilesGridProps) {
  if (loading) {
    return <Loading text="Finding people..." />
  }

  if (error) {
    return <div className="text-red-400 text-center py-20">{error}</div>
  }

  if (profiles.length === 0) {
    return (
      <div className="text-zinc-400 text-center py-20">
        No profiles found. Check back later!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {profiles.map((profile, idx) => (
        <motion.div
          key={profile.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-zinc-950/50 border border-white/8 rounded-2xl p-4 hover:border-white/12 transition-colors cursor-pointer"
          onClick={() => onOpenProfile(profile.userId)}
        >
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
            {profile.verified && <span className="text-emerald-400 text-xs">✓</span>}
          </div>

          {profile.region && <p className="text-sm text-zinc-400 mb-2">{profile.region}</p>}

          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.tags.slice(0, 3).map((tag) => (
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
  )
}
