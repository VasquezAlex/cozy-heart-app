"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart, Shield, CheckCircle2, Lock, ChevronDown, AlertTriangle, Fingerprint, Wifi } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api/client"
import { AuroraBackground } from "@/components/background"
import type { VerifyResponse, VerifyStatusResponse } from "@/lib/api/types"
// Import auth types to ensure Session interface is augmented
import "@/auth"

interface ConsentState {
  device: boolean
  ip: boolean
}

export default function VerifyPage() {
  const router = useRouter()
  const { status, data: session } = useSession()
  const [step, setStep] = useState<"loading" | "consent" | "verifying" | "complete" | "error">("loading")
  const [isOpen, setIsOpen] = useState(false)
  const [consents, setConsents] = useState<ConsentState>({ device: false, ip: false })
  const [errorMessage, setErrorMessage] = useState("Something went wrong")
  
  const verified = useRef(false)
  const initialized = useRef(false)

  const canVerify = consents.device && consents.ip

  const verify = useCallback(async () => {
    if (verified.current) return
    verified.current = true
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.fillText("Cozy Heart", 0, 0)
      
      // Use session.user.id (database UUID) or session.user.discordId depending on API expectation
      // Based on auth.ts: user.id = DB UUID, user.discordId = Discord snowflake
      const userId = session?.user?.id
      if (!userId) throw new Error("User ID not found")
      
      const data = await api<VerifyResponse>("POST", "/api/v1/verify", {
        userId: userId, // Changed from UserID to userId to match TS conventions, update API if needed
        // Or use discordId if your verify API expects the Discord ID:
        // discordId: session.user.discordId,
        DeviceData: {
          canvas: canvas.toDataURL(),
          cores: navigator.hardwareConcurrency,
          language: navigator.language,
          screen: screen.width,
          timezone: new Date().getTimezoneOffset()
        },
        Consent: {
          device: consents.device,
          ip: consents.ip,
          timestamp: new Date().toISOString()
        }
      })
      
      if (!data.success) throw new Error(data.error || "Verification failed")
      
      setStep("complete")
      setTimeout(() => router.push("/"), 2000)
      
    } catch (err) {
      console.error("Verification error:", err)
      setErrorMessage(err instanceof Error ? err.message : "Network error")
      setStep("error")
    }
  }, [session, consents, router])

  useEffect(() => {
    if (!initialized.current && status === "authenticated" && step === "loading") {
      initialized.current = true
      
      api<VerifyStatusResponse>("GET", "/api/v1/verify/status")
        .then((data) => {
          if (data.verified) {
            setStep("complete")
            setTimeout(() => router.push("/"), 1500)
          } else {
            setStep("consent")
          }
        })
        .catch(() => setStep("consent"))
    }
  }, [status, step, router])

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("discord", { callbackUrl: "/verify" })
    }
  }, [status])

  const handleRetry = () => {
    verified.current = false
    setStep("consent")
    setErrorMessage("")
    setConsents({ device: false, ip: false })
  }

  const toggleConsent = (key: keyof ConsentState) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (status === "loading" || step === "loading") {
    return (
      <AuroraBackground>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-16 h-16 text-rose-500 fill-rose-500/50 mx-auto" />
            </motion.div>
            <p className="text-zinc-400 text-sm">Loading...</p>
          </motion.div>
        </div>
      </AuroraBackground>
    )
  }

  const renderIcon = () => {
    if (step === "complete") return <CheckCircle2 className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
    if (step === "error") return <AlertTriangle className="w-8 h-8 text-red-400" />
    return <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
  }

  const renderTitle = () => {
    switch (step) {
      case "consent": return "Welcome to Cozy Heart"
      case "verifying": return "Securing..."
      case "complete": return "You're in!"
      case "error": return "Verification Failed"
      default: return ""
    }
  }

  const renderSubtitle = () => {
    switch (step) {
      case "consent": return `Hi ${session?.user?.name || 'there'}, help us keep our community safe`
      case "verifying": return "Checking your device..."
      case "complete": return "Redirecting you to the main page..."
      case "error": return "We couldn't complete your verification"
      default: return ""
    }
  }

  return (
    <AuroraBackground>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-zinc-950/50 border-white/8 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-rose-500 via-pink-500 to-violet-500" />
            
            <CardContent className="p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div 
                  className="w-20 h-20 rounded-2xl bg-linear-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg relative"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px -5px rgba(244, 63, 94, 0.3)", 
                      "0 0 40px -5px rgba(139, 92, 246, 0.3)", 
                      "0 0 20px -5px rgba(244, 63, 94, 0.3)"
                    ] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-rose-500 to-violet-600 rounded-2xl blur opacity-50" />
                  <div className="relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={step} 
                        initial={{ scale: 0, rotate: -180 }} 
                        animate={{ scale: 1, rotate: 0 }} 
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        {renderIcon()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <motion.h1 
                  className="text-3xl font-bold text-white tracking-tight"
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {renderTitle()}
                </motion.h1>
                <motion.p 
                  className="text-sm text-zinc-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {renderSubtitle()}
                </motion.p>
              </div>

              <Separator className="bg-white/8" />

              {/* Content */}
              <AnimatePresence mode="wait">
                {step === "consent" && (
                  <motion.div 
                    key="consent" 
                    className="space-y-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {/* Trust indicators */}
                    <div className="flex justify-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session?.user?.trust === "NEW" ? "bg-amber-500/20 text-amber-300" :
                        session?.user?.trust === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300" :
                        "bg-blue-500/20 text-blue-300"
                      }`}>
                        {session?.user?.trust || "NEW"}
                      </span>
                      {session?.user?.verified && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300">
                          Email Verified
                        </span>
                      )}
                    </div>

                    {/* Device Check */}
                    <motion.div 
                      onClick={() => toggleConsent('device')}
                      className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all duration-300 ${
                        consents.device 
                          ? 'bg-rose-500/10 border-rose-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Checkbox 
                        checked={consents.device} 
                        className="mt-1 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" 
                      />
                      <div className="flex-1">
                        <Label className="text-white font-medium flex items-center gap-2 cursor-pointer">
                          <Fingerprint className="w-4 h-4 text-rose-400" />
                          Verify my device *
                        </Label>
                        <p className="text-xs text-zinc-500 mt-1">I consent to browser fingerprinting for security</p>
                      </div>
                    </motion.div>

                    {/* IP Check */}
                    <motion.div 
                      onClick={() => toggleConsent('ip')}
                      className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all duration-300 ${
                        consents.ip 
                          ? 'bg-rose-500/10 border-rose-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Checkbox 
                        checked={consents.ip} 
                        className="mt-1 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" 
                      />
                      <div className="flex-1">
                        <Label className="text-white font-medium flex items-center gap-2 cursor-pointer">
                          <Wifi className="w-4 h-4 text-rose-400" />
                          Check my connection *
                        </Label>
                        <p className="text-xs text-zinc-500 mt-1">I consent to IP security checks</p>
                      </div>
                    </motion.div>

                    {/* Why we need this */}
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4" /> 
                            Why do we need this?
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 bg-white/5 rounded-xl p-4 text-xs text-zinc-400 border border-white/10"
                        >
                          We verify your device to prevent fake accounts and ensure a safe community. 
                          Your data is encrypted and auto-deletes after 90 days.
                          {session?.user?.role === "ADMIN" && (
                            <p className="mt-2 text-amber-400">Admin bypass available in settings.</p>
                          )}
                        </motion.div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Submit */}
                    <Button
                      onClick={() => {setStep("verifying"); verify()}}
                      disabled={!canVerify}
                      className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 ${
                        canVerify 
                          ? 'bg-linear-to-r from-rose-500 to-violet-600 text-white hover:opacity-90 shadow-lg shadow-rose-500/25' 
                          : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {canVerify ? (
                        <span className="flex items-center gap-2">
                          Verify & Join <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                        </span>
                      ) : (
                        "Please agree to continue"
                      )}
                    </Button>
                  </motion.div>
                )}

                {step === "verifying" && (
                  <motion.div 
                    className="flex flex-col items-center py-8 space-y-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        className="w-16 h-16 rounded-full border-4 border-white/10 border-t-rose-500" 
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                      />
                      <Lock className="absolute inset-0 m-auto w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-medium">Verifying your device...</p>
                      <p className="text-xs text-zinc-500">This may take a moment</p>
                    </div>
                  </motion.div>
                )}

                {step === "complete" && (
                  <motion.div 
                    className="text-center py-6 space-y-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full"
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Successfully Verified</span>
                    </motion.div>
                    <p className="text-sm text-zinc-400">
                      Welcome{session?.user?.name ? `, ${session.user.name}` : ''}! 💜
                    </p>
                    <motion.div 
                      className="h-1 w-32 bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full mx-auto"
                      initial={{ width: 0 }}
                      animate={{ width: 128 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}

                {step === "error" && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Alert className="bg-red-500/10 border-red-500/20 text-white">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <AlertTitle className="text-red-200">Verification Failed</AlertTitle>
                      <AlertDescription className="text-zinc-400">{errorMessage}</AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleRetry} 
                        className="flex-1 bg-white text-black hover:bg-zinc-200 font-semibold"
                      >
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => window.open('/support', '_blank')} 
                        variant="outline" 
                        className="flex-1 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                      >
                        Get Help
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer badges */}
              <div className="pt-4 flex justify-center gap-4 text-[10px] text-zinc-600">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                {session?.user?.trust && (
                  <span className="flex items-center gap-1 capitalize">Trust: {session.user.trust.toLowerCase()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}