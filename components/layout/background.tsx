import { ReactNode } from "react"

export function AuroraBackground({ 
  children, 
  className = "" 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={`relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden selection:bg-rose-500/30 ${className}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-rose-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-150 h-150 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-200 h-200 bg-purple-600/5 rounded-full blur-[150px]" />
      </div>
      <GridPattern />
      {children}
    </div>
  )
}

export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none ${className}`} />
  )
}

export function GradientBlur({ 
  color = "rose", 
  position = "top-left",
  className = "",
  size = "md"
}: { 
  color?: "rose" | "violet" | "purple" | "blue" | "emerald" | "amber"
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const colors = {
    rose: "bg-rose-600/10",
    violet: "bg-violet-600/10",
    purple: "bg-purple-600/10",
    blue: "bg-blue-600/10",
    emerald: "bg-emerald-600/10",
    amber: "bg-amber-600/10"
  }
  
  const positions = {
    "top-left": "top-[-10%] left-[-10%]",
    "top-right": "top-[-10%] right-[-10%]",
    "bottom-left": "bottom-[-10%] left-[-10%]",
    "bottom-right": "bottom-[-10%] right-[-10%]",
    "center": "top-[40%] left-[50%] -translate-x-1/2"
  }

  const sizes = {
    sm: "w-75 h-75",
    md: "w-125 h-125",
    lg: "w-150 h-150",
    xl: "w-200 h-200"
  }

  return (
    <div className={`absolute ${positions[position]} ${sizes[size]} ${colors[color]} rounded-full blur-[120px] pointer-events-none ${className}`} />
  )
}

export function GlowEffect({ 
  color = "rose",
  intensity = "md",
  className = ""
}: {
  color?: "rose" | "violet" | "purple" | "blue"
  intensity?: "low" | "md" | "high"
  className?: string
}) {
  const colors = {
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500"
  }

  const intensities = {
    low: "blur-xl opacity-30",
    md: "blur-xl opacity-50",
    high: "blur-2xl opacity-75"
  }

  return (
    <div className={`absolute inset-0 ${colors[color]} ${intensities[intensity]} ${className}`} />
  )
}