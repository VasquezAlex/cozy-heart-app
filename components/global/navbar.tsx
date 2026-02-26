"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Heart, Bell, Crown, Shield, LogOut, User, Settings, 
  MoreHorizontal, Search, Users, MessageCircle, Lock 
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExtendedSession } from "@/lib/auth/types"
import { TrustLevel, trustConfig, formatDate } from "@/lib/utils/trust"

interface NavBarProps {
  session: ExtendedSession
  trustLevel: TrustLevel
  isOnline: boolean
  unreadCount: number
  onSignOut: () => void
}

export function NavBar({ session, trustLevel, isOnline, unreadCount, onSignOut }: NavBarProps) {
  const router = useRouter()
  const trustStyle = trustConfig[trustLevel]
  const TrustIcon = trustStyle.icon

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/40 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500 blur-xl opacity-50" />
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500 relative z-10" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                Cozy Heart
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm text-zinc-400 bg-white/3 px-4 py-2 rounded-full border border-white/6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-zinc-300">
                  {session.discord.guild.isBooster && <Crown className="w-3 h-3 inline mr-1 text-amber-400" />}
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 pl-4 border-l border-white/8">
                <NotificationsDropdown 
                  notifications={session.notifications} 
                  unreadCount={unreadCount} 
                />
                
                {session.can.admin && (
                  <Badge className="bg-linear-to-r from-rose-500/20 to-orange-500/20 text-rose-300 border-rose-500/20 hidden sm:flex">
                    <Shield className="w-3 h-3 mr-1.5" />
                    {session.user.role}
                  </Badge>
                )}

                <UserDropdown 
                  user={session.user} 
                  trustLevel={trustLevel} 
                  isOnline={isOnline} 
                  isAdmin={session.can.admin}
                  onSignOut={onSignOut}
                />

                <MobileMenu 
                  session={session} 
                  trustLevel={trustLevel} 
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}

function NotificationsDropdown({ notifications, unreadCount }: { 
  notifications?: ExtendedSession["notifications"]
  unreadCount: number 
}) {
  const router = useRouter()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-white/8 rounded-full h-10 w-10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0a0a0f]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#13131a] border-white/8 text-white p-0 rounded-xl">
        <DropdownMenuLabel className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-rose-500/20 text-rose-300 text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <ScrollArea className="h-80">
          {notifications?.length ? (
            notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif.id} 
                className="px-4 py-3 focus:bg-white/5 cursor-pointer border-b border-white/5"
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
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserDropdown({ user, trustLevel, isOnline, isAdmin, onSignOut }: {
  user: ExtendedSession["user"]
  trustLevel: TrustLevel
  isOnline: boolean
  isAdmin: boolean
  onSignOut: () => void
}) {
  const trustStyle = trustConfig[trustLevel]
  const TrustIcon = trustStyle.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 hover:bg-white/8 px-3 py-2 h-auto rounded-full border border-transparent hover:border-white/8">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.handle}</p>
          </div>
          <div className="relative">
            <Avatar className="w-9 h-9 border-2 border-white/10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-linear-to-br from-rose-500 to-violet-600 text-white">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0f]" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-[#13131a] border-white/8 text-white p-2 rounded-xl" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
          <span className="text-zinc-400 text-xs uppercase tracking-wider">My Account</span>
          <Badge variant="outline" className={`${trustStyle.bg} ${trustStyle.color} border text-xs`}>
            <TrustIcon className="w-3 h-3 mr-1" />
            {trustLevel}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/8" />
        <DropdownMenuItem className="rounded-lg focus:bg-white/8 cursor-pointer px-3 py-2.5" asChild>
          <Link href="/profile" className="flex items-center gap-3">
            <User className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-200">Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg focus:bg-white/8 cursor-pointer px-3 py-2.5" asChild>
          <Link href="/settings" className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-200">Settings</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem className="rounded-lg focus:bg-rose-500/10 cursor-pointer px-3 py-2.5" asChild>
            <Link href="/admin" className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400">Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/8" />
        <DropdownMenuItem 
          className="rounded-lg focus:bg-red-500/10 cursor-pointer px-3 py-2.5 text-red-400" 
          onClick={onSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileMenu({ session, trustLevel }: { 
  session: ExtendedSession
  trustLevel: TrustLevel 
}) {
  const router = useRouter()
  
  const actions = [
    { 
      icon: Search, 
      label: "Discover", 
      href: "/seeking", 
      disabled: !session.can.seek 
    },
    { 
      icon: Users, 
      label: "Matches", 
      href: "/match-making", 
      disabled: false, 
      badge: session.stats.matches 
    },
    { 
      icon: MessageCircle, 
      label: "Messages", 
      href: "/messages", 
      disabled: !session.can.message, 
      badge: session.stats.messages 
    },
  ]

  return (
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
          <div className="px-3 py-2">
            <Badge 
              variant="outline" 
              className={`${trustConfig[trustLevel].bg} ${trustConfig[trustLevel].color} border text-xs`}
            >
              {trustLevel}
            </Badge>
          </div>
          {actions.map((action) => (
            <Link key={action.label} href={action.disabled ? "#" : action.href}>
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-zinc-300 hover:text-white hover:bg-white/8 rounded-xl h-14 px-4 ${action.disabled ? 'opacity-50' : ''}`}
                disabled={action.disabled}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mr-3">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  {action.badge ? (
                    <div className="text-xs text-zinc-500">{action.badge} new</div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      {action.disabled ? 'Locked' : 'View'}
                    </div>
                  )}
                </div>
                {action.disabled && <Lock className="ml-auto h-4 w-4 text-zinc-600" />}
              </Button>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}