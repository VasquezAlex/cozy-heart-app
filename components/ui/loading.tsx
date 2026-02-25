// components/ui/loading.tsx
"use client"

import { motion } from "framer-motion"
import { Heart, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AuroraBackground } from "@/components/background"
import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "heart" | "spinner" | "dots"
  fullScreen?: boolean
  className?: string
  showText?: boolean
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-10 h-10", 
  lg: "w-16 h-16",
  xl: "w-24 h-24"
}

interface IconProps {
  variant: "heart" | "spinner" | "dots"
  iconSize: string
}

function Icon({ variant, iconSize }: IconProps) {
  if (variant === "heart") {
    return (
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className={iconSize}
      >
        <Heart className={cn(iconSize, "fill-rose-500 text-rose-500")} />
      </motion.div>
    )
  }

  if (variant === "spinner") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={iconSize}
      >
        <Loader2 className={cn(iconSize, "text-rose-500")} />
      </motion.div>
    )
  }

  return (
    <div className={cn("flex gap-1", iconSize)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="w-2 h-2 rounded-full bg-rose-500"
        />
      ))}
    </div>
  )
}

export function Loading({ 
  text,
  size = "lg",
  variant = "heart",
  fullScreen = true,
  className,
  showText = true
}: LoadingProps) {
  const iconSize = sizes[size]

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4",
      fullScreen ? "min-h-screen" : "h-full min-h-50",
      className
    )}>
      <Icon variant={variant} iconSize={iconSize} />
      
      {showText && (
        text ? (
          <p className="text-zinc-400 text-sm font-medium animate-pulse">{text}</p>
        ) : (
          <Skeleton className="h-4 w-32 bg-white/5" />
        )
      )}
    </div>
  )

  if (fullScreen) {
    return <AuroraBackground>{content}</AuroraBackground>
  }
  return content
}

// Inline button loading state
export function ButtonLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
      </motion.div>
      {text}
    </span>
  )
}

// Card/content placeholder loading
export function ContentLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-3/4 bg-white/5" />
          <Skeleton className="h-20 w-full bg-white/5 rounded-lg" />
        </div>
      ))}
    </div>
  )
}