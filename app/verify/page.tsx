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
import type { VerifyResponse, VerifyStatusResponse } from "@/lib/api/types"

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
  const [isRetrying, setIsRetrying] = useState(false)
  
  const verified = useRef(false)
  const initialized = useRef(false)

  const canVerify = consents.device && consents.ip

  const verify = useCallback(async () => {
    if (verified.current) return
    verified.current = true
    setIsRetrying(false)
    
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.fillText("Cozy Heart", 0, 0)
      
      const UserID = (session?.user as { userId?: string })?.userId
      if (!UserID) throw new Error("User ID not found")
      
      const data = await api<VerifyResponse>("POST", "/api/v1/verify", {
        UserID,
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
    setIsRetrying(true)
    setConsents({ device: false, ip: false })
  }

  const toggleConsent = (key: keyof ConsentState) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Render helpers
  const renderIcon = () => {
    if (step === "complete") return <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
    if (step === "error") return <AlertTriangle className="w-12 h-12 text-white" />
    return <Heart className="w-12 h-12 text-white fill-white" />
  }

  const renderTitle = () => {
    switch (step) {
      case "consent": return "Welcome to Cozy Heart"
      case "verifying": return "Securing..."
      case "complete": return "You're in! 💜"
      case "error": return "Verification Failed"
      default: return ""
    }
  }

  const renderSubtitle = () => {
    switch (step) {
      case "consent": return "Help us keep our community safe & genuine"
      case "verifying": return "Checking your device..."
      case "complete": return "Redirecting you to the main page..."
      case "error": return "We couldn't complete your verification"
      default: return ""
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-rose-400 via-pink-500 to-violet-600">
      {/* Background effects */}
      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-black/10" />
      <div className="absolute top-0 left-0 w-125 h-125 bg-rose-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-150 h-150 bg-violet-400/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      {/* Animated hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ y: "110vh", x: `${10 + i * 15}%`, rotate: 0 }}
            animate={{ y: "-10vh", rotate: 360 }}
            transition={{ duration: 20 + i * 3, repeat: Infinity, delay: i * 2, ease: "linear" }}
          >
            <Heart size={20 + i * 6} className={i % 2 === 0 ? "text-rose-200/40" : "text-violet-200/40"} fill="currentColor" />
          </motion.div>
        ))}
      </div>

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        <Card className="backdrop-blur-2xl bg-white/10 border-white/20 shadow-2xl overflow-hidden">
          <motion.div className="h-1.5 w-full bg-linear-to-r from-rose-400 via-pink-500 to-violet-500" />
          
          <CardContent className="p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <motion.div 
                className="w-24 h-24 rounded-3xl bg-linear-to-br from-rose-400 to-violet-500 flex items-center justify-center shadow-lg"
                animate={{ boxShadow: ["0 0 30px -5px rgba(244, 63, 94, 0.4)", "0 0 50px -5px rgba(139, 92, 246, 0.4)", "0 0 30px -5px rgba(244, 63, 94, 0.4)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    {renderIcon()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <motion.h1 className="text-3xl font-bold text-white tracking-tight" key={step}>
                {renderTitle()}
              </motion.h1>
              <motion.p className="text-sm text-rose-100/90">
                {renderSubtitle()}
              </motion.p>
            </div>

            <Separator className="bg-white/10" />

            {/* Content */}
            <AnimatePresence mode="wait">
              {step === "consent" && (
                <motion.div key="consent" className="space-y-4">
                  {/* Device Check */}
                  <div 
                    onClick={() => toggleConsent('device')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 ${consents.device ? 'bg-white/10 border-rose-400' : 'bg-black/20 border-white/10'}`}
                  >
                    <Checkbox checked={consents.device} className="mt-1" />
                    <div>
                      <Label className="text-white font-semibold flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-rose-300" />
                        Verify my device *
                      </Label>
                      <p className="text-xs text-rose-200/70">I consent to browser fingerprinting</p>
                    </div>
                  </div>

                  {/* IP Check */}
                  <div 
                    onClick={() => toggleConsent('ip')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 ${consents.ip ? 'bg-white/10 border-rose-400' : 'bg-black/20 border-white/10'}`}
                  >
                    <Checkbox checked={consents.ip} className="mt-1" />
                    <div>
                      <Label className="text-white font-semibold flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-rose-300" />
                        Check my connection *
                      </Label>
                      <p className="text-xs text-rose-200/70">I consent to IP security checks</p>
                    </div>
                  </div>

                  {/* Why we need this */}
                  <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between text-rose-100/80">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Why do we need this?</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 bg-black/20 rounded-xl p-4 text-xs text-rose-100/80">
                        We verify your device to stop fake accounts. Data auto-deletes after 90 days.
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Submit */}
                  <Button
                    onClick={() => {setStep("verifying"); verify()}}
                    disabled={!canVerify}
                    className={`w-full h-12 font-bold rounded-xl ${canVerify ? 'bg-white text-rose-600' : 'bg-white/10 text-white/40'}`}
                  >
                    {canVerify ? "Verify & Join →" : "Please agree above"}
                  </Button>
                </motion.div>
              )}

              {step === "verifying" && (
                <div className="flex flex-col items-center py-8 space-y-6">
                  <div className="relative">
                    <motion.div animate={{ rotate: 360 }} className="w-16 h-16 rounded-full border-4 border-rose-300/30 border-t-rose-400" transition={{ duration: 1, repeat: Infinity }} />
                    <Lock className="absolute inset-0 m-auto w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-rose-100/90">Verifying your device...</p>
                </div>
              )}

              {step === "complete" && (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-full">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Successfully Verified</span>
                  </div>
                  <p className="text-sm text-rose-100/90">Welcome to Cozy Heart! 💜</p>
                </div>
              )}

              {step === "error" && (
                <div className="space-y-4">
                  <Alert className="bg-red-500/10 border-red-500/30 text-white">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3">
                    <Button onClick={handleRetry} className="flex-1 bg-white text-rose-600 font-semibold">
                      Try Again
                    </Button>
                    <Button onClick={() => window.open('/support', '_blank')} variant="outline" className="flex-1 border-white/30 text-white">
                      Get Help
                    </Button>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Footer badges */}
            <div className="pt-4 flex justify-center gap-4 text-[10px] text-rose-200/40">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}