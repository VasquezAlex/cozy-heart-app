"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { Heart, Shield, CheckCircle2, Lock, ChevronDown, Sparkles, AlertTriangle, Fingerprint, Wifi } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// Import from our modular API
import { api as APIClient } from "@/lib/api/server"
import { VerifyResponse, VerifyStatusResponse } from "@/lib/api/types"

interface ConsentState {
  device: boolean
  ip: boolean
}

export default function VerifyPage() {
  const { status, data: session } = useSession()
  const [step, setStep] = useState<"loading" | "consent" | "verifying" | "complete" | "error">("loading")
  const [isOpen, setIsOpen] = useState(false)
  const [consents, setConsents] = useState<ConsentState>({
    device: false,
    ip: false
  })
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
      if (ctx) {
        ctx.fillText("Cozy Heart", 0, 0)
      }
      
      const UserID = (session?.user as { userId?: string })?.userId
      
      if (!UserID) {
        setErrorMessage("User ID not found. Please re-login.")
        setStep("error")
        return
      }
      
      // Use APIClient instead of raw fetch
      const data = await APIClient<VerifyResponse>("POST", "/api/v1/verify", {
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
      
      if (!data.success) {
        setErrorMessage(data.error || "Verification failed")
        setStep("error")
        return
      }
      
      setStep("complete")
      setTimeout(() => window.close(), 2000)
    } catch (err) {
      console.error("Verification error:", err)
      setErrorMessage(err instanceof Error ? err.message : "Network error. Check your connection or try disabling VPN.")
      setStep("error")
    }
  }, [session, consents])

  useEffect(() => {
    if (!initialized.current && status === "authenticated" && step === "loading") {
      initialized.current = true
      
      // Use APIClient for the status check
      APIClient<VerifyStatusResponse>("GET", "/api/v1/verify/status")
        .then((data) => {
          if (data.verified) {
            setStep("complete")
            setTimeout(() => window.close(), 1500)
          } else {
            queueMicrotask(() => setStep("consent"))
          }
        })
        .catch(() => queueMicrotask(() => setStep("consent")))
    }
  }, [status, step])

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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-rose-400 via-pink-500 to-violet-600">
      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-black/10" />
      <div className="absolute top-0 left-0 w-125 h-125 bg-rose-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-150 h-150 bg-violet-400/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-pink-300/20 rounded-full blur-3xl" />

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

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute text-white/40"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
            style={{ left: `${20 + i * 20}%`, top: `${30 + (i % 2) * 40}%` }}
          >
            <Sparkles size={16} />
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        <Card className="backdrop-blur-2xl bg-white/10 border-white/20 shadow-2xl shadow-black/20 overflow-hidden">
          <motion.div 
            className="h-1.5 w-full bg-linear-to-r from-rose-400 via-pink-500 to-violet-500"
            animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 100%" }}
          />
          
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <motion.div 
                  className="w-24 h-24 rounded-3xl bg-linear-to-br from-rose-400 to-violet-500 flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white/30 relative overflow-hidden"
                  animate={{ 
                    boxShadow: [
                      "0 0 30px -5px rgba(244, 63, 94, 0.4)",
                      "0 0 50px -5px rgba(139, 92, 246, 0.4)",
                      "0 0 30px -5px rgba(244, 63, 94, 0.4)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent" 
                    animate={{ x: ["-100%", "100%"] }} 
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} 
                  />
                  <AnimatePresence mode="wait">
                    {step === "complete" ? (
                      <motion.div key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                      </motion.div>
                    ) : step === "error" ? (
                      <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                        <AlertTriangle className="w-12 h-12 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div key="heart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                        <Heart className="w-12 h-12 text-white fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div 
                  className="absolute -inset-4 rounded-full border border-white/10" 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-rose-300 rounded-full shadow-lg shadow-rose-400/50" />
                </motion.div>
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <motion.h1 className="text-3xl font-bold text-white tracking-tight" key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {step === "consent" && "Welcome to Cozy Heart"}
                {step === "verifying" && "Securing..."}
                {step === "complete" && "You're in! 💜"}
                {step === "error" && "Verification Failed"}
              </motion.h1>
              <motion.p className="text-sm text-rose-100/90" key={step + "sub"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {step === "consent" && "Help us keep our community safe & genuine"}
                {step === "verifying" && "Checking your device..."}
                {step === "complete" && "Get ready to make meaningful connections"}
                {step === "error" && "We couldn't complete your verification"}
              </motion.p>
            </div>

            <Separator className="bg-white/10" />

            <AnimatePresence mode="wait">
              {step === "consent" && (
                <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                  
                  {/* Device Check - Required */}
                  <motion.div 
                    onClick={() => toggleConsent('device')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${consents.device ? 'bg-white/10 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Checkbox 
                      id="device-check"
                      checked={consents.device}
                      onCheckedChange={() => toggleConsent('device')}
                      className="mt-1 data-[state=checked]:bg-rose-400 data-[state=checked]:border-rose-400 border-white/40"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="device-check" className="text-white font-semibold cursor-pointer flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-rose-300" />
                        Verify my device *
                      </Label>
                      <p className="text-xs text-rose-200/70 leading-relaxed">
                        I consent to browser fingerprinting to detect fake accounts & catfish
                      </p>
                    </div>
                  </motion.div>

                  {/* IP Check - Required */}
                  <motion.div 
                    onClick={() => toggleConsent('ip')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${consents.ip ? 'bg-white/10 border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Checkbox 
                      id="ip-check"
                      checked={consents.ip}
                      onCheckedChange={() => toggleConsent('ip')}
                      className="mt-1 data-[state=checked]:bg-rose-400 data-[state=checked]:border-rose-400 border-white/40"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="ip-check" className="text-white font-semibold cursor-pointer flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-rose-300" />
                        Check my connection *
                      </Label>
                      <p className="text-xs text-rose-200/70 leading-relaxed">
                        I consent to IP security checks to prevent ban evasion
                      </p>
                    </div>
                  </motion.div>

                  {/* Info Toggle */}
                  <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-between text-xs text-rose-100/80 hover:text-white hover:bg-white/10 rounded-xl h-auto py-3 px-4">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Why do we need this?
                        </span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 bg-black/20 rounded-xl p-4 text-xs text-rose-100/80 leading-relaxed border border-white/5">
                        We verify your device fingerprint and IP to stop banned users and catfish from returning. 
                        All data is encrypted and auto-deletes after 90 days. 
                        <a href="/privacy" className="underline hover:text-rose-300 ml-1 transition-colors">Read our Privacy Policy</a>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Main Button */}
                  <motion.div whileHover={canVerify ? { scale: 1.02 } : {}} whileTap={canVerify ? { scale: 0.98 } : {}}>
                    <Button
                      onClick={() => {setStep("verifying"); verify()}}
                      disabled={!canVerify}
                      className={`w-full h-12 font-bold text-base rounded-xl shadow-lg transition-all relative overflow-hidden group ${canVerify ? 'bg-white text-rose-600 hover:bg-rose-50 shadow-white/25' : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'}`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {canVerify ? "Verify & Join" : "Please agree above to continue"}
                        {canVerify && <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>}
                      </span>
                    </Button>
                  </motion.div>

                  <p className="text-[10px] text-rose-200/40 text-center">
                    * Required for security • Your consent is recorded and timestamped
                  </p>
                </motion.div>
              )}

              {step === "verifying" && (
                <motion.div key="verifying" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center py-8 space-y-6">
                  <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-rose-300/30 border-t-rose-400 border-r-violet-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div 
                        key={i} 
                        className="w-2.5 h-2.5 rounded-full bg-rose-300" 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} 
                      />
                    ))}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-rose-100/90 font-medium">Verifying your device...</p>
                    <p className="text-xs text-rose-200/60">This takes just a few seconds</p>
                  </div>
                </motion.div>
              )}

              {step === "complete" && (
                <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                  <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Successfully Verified</span>
                  </motion.div>
                  <motion.p className="text-sm text-rose-100/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    Welcome to Cozy Heart! 💜
                  </motion.p>
                  <motion.p className="text-xs text-rose-200/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    Redirecting you back...
                  </motion.p>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  
                  <Alert className="bg-red-500/10 border-red-500/30 text-white backdrop-blur-sm">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <AlertTitle className="text-red-200 font-semibold mb-1">Verification Failed</AlertTitle>
                    <AlertDescription className="text-red-100/80 text-sm leading-relaxed">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-rose-200/60 text-center">
                      Common issues: Browser privacy mode, VPNs, or incognito windows can block verification.
                    </p>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleRetry} 
                        disabled={isRetrying}
                        className="flex-1 bg-white text-rose-600 hover:bg-rose-50 font-semibold rounded-xl h-11"
                      >
                        {isRetrying ? "Retrying..." : "Try Again"}
                      </Button>
                      <Button 
                        onClick={() => window.open('/support', '_blank')} 
                        variant="outline" 
                        className="flex-1 border-white/30 text-white hover:bg-white/10 rounded-xl h-11"
                      >
                        Get Help
                      </Button>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.location.reload()} 
                    className="w-full text-xs text-rose-200/50 hover:text-rose-200 transition-colors py-2"
                  >
                    Reload page
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 flex items-center justify-center gap-4 text-[10px] text-rose-200/40">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> GDPR Ready</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ISO 27001</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="absolute -inset-1 bg-linear-to-r from-rose-400 to-violet-500 rounded-3xl blur opacity-20 -z-10 animate-pulse" />
      </motion.div>
    </div>
  )
}