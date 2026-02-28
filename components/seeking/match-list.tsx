import Image from "next/image"
import type { SeekingProfile } from "@/app/(app)/seeking/types"

interface MatchListProps {
  profiles: SeekingProfile[]
  onSelect: (userId: string) => void
}

export function MatchList({ profiles, onSelect }: MatchListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          onClick={() => onSelect(profile.userId)}
          className="bg-zinc-950/50 border border-white/8 rounded-2xl p-4 hover:border-white/12 transition-colors text-left"
        >
          <div className="aspect-square bg-zinc-900 rounded-xl mb-4 overflow-hidden relative">
            {profile.photos?.[0] ? (
              <Image src={profile.photos[0]} alt={profile.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                No Photo
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">
            {profile.name}, {profile.age}
          </h3>
        </button>
      ))}
    </div>
  )
}
