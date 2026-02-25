"use client"

import { signOut, useSession } from "next-auth/react"
import { 
  Heart, Users, Search, MessageCircle, User, 
  Sparkles, TrendingUp, Activity,
  Bell, Settings, Zap, MoreHorizontal, LogOut,
  Calendar, Verified, Shield, Lock,
  Inbox, Crown, ChevronRight, Clock,
  X, Check, Camera, FileText, Gift, Eye
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loading } from "@/components/ui/loading"
import Link from "next/link"
import Image from "next/image"
import { redirect, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AuroraBackground } from "@/components/background"

interface Session {
  user: {
    id: string
    name: string
    handle: string
    email: string
    avatar: string
    age?: number
    joined: string
    trust: "NEW" | "PENDING" | "VERIFIED" | "TRUSTED" | "ELITE"
    verified: boolean
    role?: string
    online: boolean
    lastSeen?: string
  }
  discord: {
    guild: {
      isBooster: boolean
      nickname?: string
    }
  }
  profile: {
    complete: boolean
    photos: number
    bio?: string
    boosted: boolean
    boostExpiry?: string
    interests?: string[]
    location?: string
  }
  stats: {
    views: number
    matches: number
    messages: number
    likes: number
    score: number
  }
  can: {
    seek: boolean
    message: boolean
    admin: boolean
  }
  preferences: {
    notifications: boolean
    onlineStatus: boolean
    theme: "dark" | "light" | "system"
  }
  recentActivities?: Array<{
    id: string
    type: "match" | "like" | "view" | "message" | "system"
    title: string
    description: string
    timestamp: string
    read: boolean
    user?: {
      name: string
      avatar: string
      id: string
    }
  }>
  notifications?: Array<{
    id: string
    type: "message" | "match" | "like" | "system" | "boost"
    title: string
    message: string
    timestamp: string
    read: boolean
    actionUrl?: string
  }>
  suggestedMatches?: Array<{
    id: string
    name: string
    avatar: string
    age: number
    location: string
    matchPercentage: number
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1 
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring" as const,
      stiffness: 100, 
      damping: 15,
      mass: 1
    }
  }
}

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02,
    y: -4,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  }
} as const

export default function HomePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [dismissedPremium, setDismissedPremium] = useState(false)
  
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissPremiumCTA')
    if (dismissed) setDismissedPremium(true)
  }, [])

  if (status === "loading") {
    return <Loading />
  }
  
  if (!session) {
    redirect("/")
  }

  const Session = session as unknown as Session
  const { user, discord, profile, stats, can, preferences } = Session
  
  const completionSteps = [
    { label: "Add Photos", complete: profile.photos > 0, icon: Camera },
    { label: "Write Bio", complete: !!profile.bio, icon: FileText },
    { label: "Verify Age", complete: !!user.age, icon: Calendar },
    { label: "Add Interests", complete: (profile.interests?.length || 0) > 0, icon: Sparkles }
  ]
  
  const completedSteps = completionSteps.filter(s => s.complete).length
  const profilePercent = profile.complete ? 100 : Math.min(100, (completedSteps / completionSteps.length) * 100)

  const handleOnlineToggle = async (checked: boolean) => {
    setIsUpdatingStatus(true)
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlineStatus: checked })
      })
      await update({ ...session, preferences: { ...preferences, onlineStatus: checked } })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const dismissPremium = () => {
    setDismissedPremium(true)
    localStorage.setItem('dismissPremiumCTA', 'true')
  }

  const mainActions = [
    { 
      icon: Search, 
      label: "Discover", 
      desc: can.seek ? "Find your perfect match" : `Complete ${4 - completedSteps} more steps`,
      href: "/seeking",
      gradient: "from-rose-500 via-pink-500 to-rose-600",
      shadow: "shadow-rose-500/25",
      badge: null,
      disabled: !can.seek,
      iconBg: "bg-rose-500/20"
    },
    { 
      icon: Users, 
      label: "Matches", 
      desc: stats.matches === 0 ? "No connections yet" : `${stats.matches} connection${stats.matches !== 1 ? 's' : ''}`,
      href: "/match-making",
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      shadow: "shadow-violet-500/25",
      badge: stats.matches > 0 ? stats.matches.toString() : null,
      disabled: false,
      iconBg: "bg-violet-500/20"
    },
    { 
      icon: MessageCircle, 
      label: "Messages", 
      desc: stats.messages === 0 ? "No unread messages" : `${stats.messages} unread`,
      href: "/messages",
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
      shadow: "shadow-blue-500/25",
      badge: stats.messages > 0 ? stats.messages.toString() : null,
      disabled: !can.message,
      iconBg: "bg-blue-500/20"
    }
  ]

  const trustConfig = {
    "NEW": { color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", icon: User, label: "New Member" },
    "PENDING": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock, label: "Pending Verification" },
    "VERIFIED": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Verified, label: "Verified" },
    "TRUSTED": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Shield, label: "Trusted Member" },
    "ELITE": { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: Crown, label: "Elite Member" }
  }

  const trustStyle = trustConfig[user.trust] || trustConfig["NEW"]
  const TrustIcon = trustStyle.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const unreadCount = (Session.notifications?.filter(n => !n.read).length || 0) + stats.messages + stats.matches

  return (
    <AuroraBackground>
      <TooltipProvider delayDuration={100}>
        <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500 blur-xl opacity-50" />
                  <Heart className="w-8 h-8 text-rose-500 fill-rose-500 relative z-10" />
                </div>
                <span className="text-2xl font-bold bg-linear-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
                  Cozy Heart
                </span>
              </motion.div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 text-sm text-zinc-400 bg-white/3 px-4 py-2 rounded-full border border-white/6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-zinc-300">
                    {discord.guild.isBooster && <Crown className="w-3 h-3 inline mr-1 text-amber-400" />}
                    {preferences.onlineStatus ? "Online" : "Appear Offline"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 pl-4 border-l border-white/8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative text-zinc-400 hover:text-white hover:bg-white/8 rounded-full h-10 w-10 transition-all duration-300"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0a0a0f] animate-pulse" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-[#13131a] border-white/8 text-white p-0 rounded-xl backdrop-blur-xl overflow-hidden">
                      <DropdownMenuLabel className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                        <span className="text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="bg-rose-500/20 text-rose-300 text-xs">
                            {unreadCount} new
                          </Badge>
                        )}
                      </DropdownMenuLabel>
                      <ScrollArea className="h-80">
                        {Session.notifications?.length ? (
                          Session.notifications.map((notif) => (
                            <DropdownMenuItem 
                              key={notif.id} 
                              className="px-4 py-3 focus:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                              onClick={() => notif.actionUrl && router.push(notif.actionUrl)}
                            >
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full ${notif.read ? 'bg-zinc-600' : 'bg-rose-500'}`} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-zinc-200">{notif.title}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5">{notif.message}</p>
                                  <p className="text-xs text-zinc-600 mt-1">{formatDate(notif.timestamp)}</p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <Inbox className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        )}
                      </ScrollArea>
                      <div className="p-2 border-t border-white/8 bg-white/5">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-400 hover:text-white">
                          Mark all as read
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {can.admin && (
                    <Badge className="bg-linear-to-r from-rose-500/20 to-orange-500/20 text-rose-300 border-rose-500/20 backdrop-blur-sm hidden sm:flex">
                      <Shield className="w-3 h-3 mr-1.5" />
                      {user.role}
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-3 hover:bg-white/8 px-3 py-2 h-auto rounded-full transition-all duration-300 border border-transparent hover:border-white/8"
                      >
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                          <p className="text-xs text-zinc-500 leading-tight">{user.handle}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 bg-linear-to-r from-rose-500 to-violet-500 rounded-full blur opacity-50" />
                          <Avatar className="w-9 h-9 border-2 border-white/10 relative z-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-linear-to-br from-rose-500 to-violet-600 text-white text-sm font-semibold">
                              {user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {user.online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] z-20" />
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-64 bg-[#13131a] border-white/8 text-white p-2 rounded-xl backdrop-blur-xl" 
                      align="end"
                      sideOffset={8}
                    >
                      <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">My Account</span>
                        <Badge 
                          variant="outline" 
                          className={`${trustStyle.bg} ${trustStyle.color} border text-xs font-medium`}
                        >
                          <TrustIcon className="w-3 h-3 mr-1" />
                          {user.trust}
                        </Badge>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/8 my-2" />
                      <DropdownMenuItem className="rounded-lg focus:bg-white/8 cursor-pointer px-3 py-2.5" asChild>
                        <Link href="/profile" className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-400" />
                          </div>
                          <span className="text-zinc-200">Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg focus:bg-white/8 cursor-pointer px-3 py-2.5" asChild>
                        <Link href="/settings" className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-zinc-400" />
                          </div>
                          <span className="text-zinc-200">Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      {can.admin && (
                        <DropdownMenuItem className="rounded-lg focus:bg-rose-500/10 cursor-pointer px-3 py-2.5" asChild>
                          <Link href="/admin" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-rose-400" />
                            </div>
                            <span className="text-rose-400">Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/8 my-2" />
                      <DropdownMenuItem 
                        className="rounded-lg focus:bg-red-500/10 cursor-pointer px-3 py-2.5 text-red-400 focus:text-red-400" 
                        onClick={() => signOut()}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>Log out</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Sheet>
                    <SheetTrigger asChild className="lg:hidden">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/8 rounded-full">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-[#0a0a0f] border-white/8 w-75 p-0">
                      <SheetHeader className="p-6 border-b border-white/8">
                        <SheetTitle className="text-white flex items-center gap-3">
                          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                          Menu
                        </SheetTitle>
                      </SheetHeader>
                      <div className="p-4 space-y-2">
                        {mainActions.map((action) => (
                          <Link key={action.label} href={action.disabled ? "#" : action.href}>
                            <Button 
                              variant="ghost" 
                              className={`w-full justify-start text-zinc-300 hover:text-white hover:bg-white/8 rounded-xl h-14 px-4 ${action.disabled ? 'opacity-50' : ''}`}
                              disabled={action.disabled}
                            >
                              <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center mr-3`}>
                                <action.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{action.label}</div>
                                <div className="text-xs text-zinc-500">{action.desc}</div>
                              </div>
                              {action.disabled && <Lock className="ml-auto h-4 w-4 text-zinc-600" />}
                            </Button>
                          </Link>
                        ))}
                        <Separator className="bg-white/8 my-4" />
                        <div className="flex items-center justify-between px-4 py-3 bg-white/3 rounded-xl">
                          <div className="flex flex-col">
                            <Label htmlFor="online-status-mobile" className="text-zinc-300 font-medium">Appear Online</Label>
                            <span className="text-xs text-zinc-500">{preferences.onlineStatus ? 'Visible to others' : 'Hidden'}</span>
                          </div>
                          <Switch 
                            id="online-status-mobile" 
                            checked={preferences.onlineStatus} 
                            onCheckedChange={handleOnlineToggle}
                            disabled={isUpdatingStatus}
                          />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
            <div className="lg:col-span-8 space-y-6">
              <motion.section variants={itemVariants} className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`${trustStyle.bg} ${trustStyle.color} border backdrop-blur-sm px-3 py-1.5 text-xs font-semibold tracking-wide uppercase`}
                  >
                    <TrustIcon className="w-3.5 h-3.5 mr-1.5" />
                    {trustStyle.label}
                  </Badge>
                  {user.verified && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 backdrop-blur-sm px-3 py-1.5">
                      <Verified className="w-3.5 h-3.5 mr-1.5" />
                      Verified
                    </Badge>
                  )}
                  {profile.boosted && (
                    <Badge className="bg-linear-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/20 backdrop-blur-sm px-3 py-1.5">
                      <Zap className="w-3.5 h-3.5 mr-1.5 fill-amber-400" />
                      {profile.boostExpiry ? `Boosted until ${formatDate(profile.boostExpiry)}` : 'Boosted'}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    <span className="text-zinc-500">Welcome back,</span>
                    <br />
                    <span className="bg-linear-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                      {user.name}
                    </span>
                    <motion.span 
                      className="inline-block ml-3"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      👋
                    </motion.span>
                  </h1>
                  <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                    {stats.matches > 0 || stats.messages > 0 ? (
                      <>
                        You have <span className="text-rose-400 font-semibold">{stats.matches} match{stats.matches !== 1 ? 'es' : ''}</span> and <span className="text-blue-400 font-semibold">{stats.messages} message{stats.messages !== 1 ? 's' : ''}</span> waiting.
                      </>
                    ) : (
                      <span className="text-zinc-500">Start your journey. Complete your profile to connect with amazing people.</span>
                    )}
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mainActions.map((action) => (
                  <motion.div
                    key={action.label}
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover={action.disabled ? "rest" : "hover"}
                  >
                    <Link 
                      href={action.disabled ? "#" : action.href} 
                      className={`block h-full ${action.disabled ? 'pointer-events-none' : ''}`}
                    >
                      <Card className={`relative overflow-hidden bg-zinc-950/50 border-white/8 hover:border-white/12 transition-all duration-500 h-full group ${action.disabled ? 'opacity-60' : ''}`}>
                        <div className={`absolute inset-0 bg-linear-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${action.gradient} ${action.shadow} shadow-lg flex items-center justify-center`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            {action.badge ? (
                              <Badge className="bg-white text-black font-bold border-0 shadow-lg shadow-black/20">
                                {action.badge}
                              </Badge>
                            ) : action.disabled ? (
                              <Lock className="w-5 h-5 text-zinc-600" />
                            ) : null}
                          </div>
                          
                          <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                            {action.label}
                            {!action.disabled && (
                              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all duration-300" />
                            )}
                          </h3>
                          <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {action.desc}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.section>

              {can.seek && Session.suggestedMatches && Session.suggestedMatches.length > 0 && (
                <motion.section variants={itemVariants}>
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
                        {Session.suggestedMatches.map((match, idx) => (
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
              )}

              <motion.section variants={itemVariants}>
                <Card className="bg-zinc-950/50 border-white/8 overflow-hidden">
                  <CardHeader className="pb-4 border-b border-white/6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg font-semibold">Your Stats</CardTitle>
                        <CardDescription className="text-zinc-500 mt-1">
                          {stats.score > 0 ? `Popularity Score: ${stats.score}/100` : 'Complete your profile to boost visibility'}
                        </CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-zinc-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: "Profile Views", value: stats.views, icon: Eye, color: "text-rose-400" },
                        { label: "Matches", value: stats.matches, icon: Heart, color: "text-pink-400" },
                        { label: "Messages", value: stats.messages, icon: MessageCircle, color: "text-blue-400" },
                        { label: "Likes Received", value: stats.likes, icon: Sparkles, color: "text-amber-400" },
                      ].map((stat, i) => (
                        <motion.div 
                          key={stat.label} 
                          className="relative group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="absolute inset-0 bg-white/3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative p-4 space-y-2">
                            <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
                            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>

              {!profile.boosted && !dismissedPremium && (
                <motion.section variants={itemVariants} layout>
                  <Card className="relative overflow-hidden bg-linear-to-br from-rose-500/20 via-purple-500/20 to-violet-500/20 border-rose-500/30">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-zinc-300 hover:text-white hover:bg-white/10 z-20"
                      onClick={dismissPremium}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/30 rounded-full blur-3xl" />
                    <CardContent className="relative p-8 z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-md">
                          <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm mb-2">
                            <Crown className="w-3 h-3 mr-1.5" /> Premium
                          </Badge>
                          <h2 className="text-3xl font-bold text-white">Boost Your Profile</h2>
                          <p className="text-zinc-200 leading-relaxed">
                            Get seen by 10x more people. Premium members get 5x more matches on average.
                          </p>
                          <div className="flex items-center gap-4 text-sm text-zinc-200 pt-2">
                            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Priority listing</span>
                            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Unlimited likes</span>
                            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> See who liked you</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button 
                            className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-6 rounded-xl shadow-2xl shadow-black/20 transition-all hover:scale-105"
                            onClick={() => router.push('/premium')}
                          >
                            <Zap className="w-4 h-4 mr-2 fill-black" />
                            Get Boost
                          </Button>
                          <p className="text-xs text-zinc-300 text-center font-medium">Starting at $9.99/mo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <motion.div variants={itemVariants}>
                <Card className="bg-zinc-950/50 border-white/8 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-linear-to-br from-rose-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="h-1 w-full bg-linear-to-r from-rose-500 via-pink-500 to-violet-500" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4 mb-6">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="relative cursor-pointer" onClick={() => router.push('/profile')}>
                            <div className="absolute inset-0 bg-linear-to-r from-rose-500 to-violet-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                            <Avatar className="w-16 h-16 border-2 border-white/10 rounded-2xl relative">
                              <AvatarImage src={user.avatar} className="rounded-2xl" />
                              <AvatarFallback className="bg-linear-to-br from-rose-500 to-violet-600 text-white text-xl rounded-2xl">
                                {user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            {user.online && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-[#0a0a0f] flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 bg-[#13131a] border-white/8 text-white p-4 rounded-2xl">
                          <div className="flex gap-4">
                            <Avatar className="w-12 h-12 rounded-xl">
                              <AvatarImage src={user.avatar} className="rounded-xl" />
                              <AvatarFallback className="rounded-xl">{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="font-semibold text-white">{user.name}</h4>
                              <p className="text-sm text-zinc-500">{user.handle}</p>
                              <div className="flex items-center gap-2 pt-2 text-xs text-zinc-400">
                                <Calendar className="w-3 h-3" />
                                Joined {new Date(user.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
                          {profile.location && (
                            <span className="bg-white/6 px-2 py-1 rounded-md">{profile.location}</span>
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
                            <div key={step.label} className={`flex items-center gap-2 text-xs ${step.complete ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {step.complete ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-zinc-600" />}
                              <step.icon className="w-3 h-3" />
                              <span className={step.complete ? 'line-through opacity-60' : ''}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl h-11 transition-all duration-300" 
                      onClick={() => router.push('/profile')}
                    >
                      {profile.complete ? 'Edit Profile' : 'Complete Profile'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-zinc-950/50 border-white/8">
                  <CardHeader className="pb-4 border-b border-white/6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-400" />
                        Recent Activity
                      </CardTitle>
                      {Session.recentActivities && Session.recentActivities.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-xs" asChild>
                          <Link href="/activity">View All</Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {Session.recentActivities && Session.recentActivities.length > 0 ? (
                      <div className="space-y-4">
                        {Session.recentActivities.slice(0, 4).map((activity, idx) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => activity.type === 'match' && router.push(`/match-making`)}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              activity.type === 'match' ? 'bg-rose-500/20 text-rose-400' :
                              activity.type === 'like' ? 'bg-pink-500/20 text-pink-400' :
                              activity.type === 'view' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-zinc-500/20 text-zinc-400'
                            }`}>
                              {activity.type === 'match' ? <Heart className="w-5 h-5" /> :
                               activity.type === 'like' ? <Sparkles className="w-5 h-5" /> :
                               activity.type === 'view' ? <Eye className="w-5 h-5" /> :
                               <Gift className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                                {activity.title}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{activity.description}</p>
                              <p className="text-xs text-zinc-600 mt-0.5">{formatDate(activity.timestamp)}</p>
                            </div>
                            {!activity.read && <div className="w-2 h-2 bg-rose-500 rounded-full mt-2" />}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center mb-4">
                          <Inbox className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">No recent activity</p>
                        <p className="text-xs text-zinc-600 mt-1">Start exploring to see updates</p>
                        <Button variant="outline" size="sm" className="mt-4 border-white/10 hover:bg-white/5" asChild>
                          <Link href="/seeking">Explore</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/profile">
                      <Button 
                        variant="outline" 
                        className="w-full h-auto aspect-square flex flex-col items-center justify-center gap-3 bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/12 rounded-2xl transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <User className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">Profile</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Profile</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings">
                      <Button 
                        variant="outline" 
                        className="w-full h-auto aspect-square flex flex-col items-center justify-center gap-3 bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/12 rounded-2xl transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Settings className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">Settings</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Settings</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/premium">
                      <Button 
                        variant="outline" 
                        className="w-full h-auto aspect-square flex flex-col items-center justify-center gap-3 bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/12 rounded-2xl transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Gift className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">Premium</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Premium</p></TooltipContent>
                </Tooltip>
              </motion.div>

              <Separator className="bg-white/6" />

              <motion.div variants={itemVariants} className="text-center text-xs text-zinc-600 space-y-3">
                <div className="flex justify-center gap-6">
                  {["Privacy", "Terms", "Support", "Guidelines"].map((link) => (
                    <Link 
                      key={link} 
                      href={`/${link.toLowerCase()}`} 
                      className="hover:text-zinc-400 transition-colors duration-300"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
                <p className="text-zinc-700">© {new Date().getFullYear()} Cozy Heart</p>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </TooltipProvider>
    </AuroraBackground>
  )
}