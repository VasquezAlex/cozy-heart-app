"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { Heart, Shield, CheckCircle2, Lock, ChevronDown, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function VerifyPage() {
  const { status, data: session } = useSession()
  const [step, setStep] = useState<"loading" | "consent" | "verifying" | "complete" | "error">("loading")
  const [isOpen, setIsOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const verified = useRef(false)
  const initialized = useRef(false)

  const verify = useCallback(async () => {
    if (verified.current) return
    verified.current = true
    
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      ctx?.fillText("Cozy Heart", 0, 0)
      
      const UserID = (session?.user as { userId?: string })?.userId
      
      const res = await fetch("/api/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserID: UserID,
          DeviceData: [
            canvas.toDataURL(),
            navigator.hardwareConcurrency,
            navigator.language,
            screen.width,
            new Date().getTimezoneOffset()
          ],
          Consent: { agreed: true, timestamp: new Date().toISOString() }
        }),
      })

      const data = await res.json()
      setStep(data.success ? "complete" : "error")
      if (data.success) setTimeout(() => window.close(), 2000)
    } catch {
      setStep("error")
    }
  }, [session])

  useEffect(() => {
    if (!initialized.current && status === "authenticated" && step === "loading") {
      initialized.current = true
      queueMicrotask(() => setStep("consent"))
    }
  }, [status, step])

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("discord", { callbackUrl: "/verify" })
    }
  }, [status])

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-rose-400 via-pink-500 to-violet-600">
      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-black/10" />
      <div className="absolute top-0 left-0 w-125 h-12h-125-300/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
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
                  animate={{ boxShadow: ["0 0 30px -5px rgba(244, 63, 94, 0.4)", "0 0 50px -5px rgba(139, 92, 246, 0.4)", "0 0 30px -5px rgba(244, 63, 94, 0.4)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />
                  <AnimatePresence mode="wait">
                    {step === "complete" ? (
                      <motion.div key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} transition={{ type: "spring", stiffness: 200 }}>
                        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                      </motion.div>
                    ) : (
                      <motion.div key="heart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                        <Heart className="w-12 h-12 text-white fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div className="absolute -inset-4 rounded-full border border-white/10" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-rose-300 rounded-full shadow-lg shadow-rose-400/50" />
                </motion.div>
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <motion.h1 className="text-3xl font-bold text-white tracking-tight" key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {step === "consent" && "Welcome to Cozy Heart"}
                {step === "verifying" && "Securing..."}
                {step === "complete" && "You're in! 💜"}
                {step === "error" && "Hmm, something's off"}
              </motion.h1>
              <motion.p className="text-sm text-rose-100/90" key={step + "sub"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {step === "consent" && "One quick step to keep our community genuine"}
                {step === "verifying" && "Just a moment while we set things up..."}
                {step === "complete" && "Get ready to make meaningful connections"}
                {step === "error" && "Let's try that again"}
              </motion.p>
            </div>

            <Separator className="bg-white/10" />

            <AnimatePresence mode="wait">
              {step === "consent" && (
                <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
                  
                  {/* Modern Checkbox - Friendly but legally sound */}
                  <motion.div 
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${agreed ? 'bg-white/10 border-rose-400/50' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                    onClick={() => setAgreed(!agreed)}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Checkbox 
                      id="verify-consent" 
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      className="mt-0.5 data-[state=checked]:bg-rose-400 data-[state=checked]:border-rose-400 border-white/30"
                    />
                    <div className="space-y-1 leading-none">
                      <Label 
                        htmlFor="verify-consent" 
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        I agree to keep Cozy Heart safe
                      </Label>
                      <p className="text-xs text-rose-200/70">
                        I understand this verifies my device to prevent fake accounts.{' '}
                        <a href="/privacy" className="underline hover:text-rose-300 transition-colors">Privacy Policy</a>
                      </p>
                    </div>
                  </motion.div>

                  {/* Collapsible Info */}
                  <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-between text-xs text-rose-100/80 hover:text-white hover:bg-white/10 rounded-xl h-auto py-3 px-4">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Why do we verify?
                        </span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 bg-black/20 rounded-xl p-4 text-xs text-rose-100/80 leading-relaxed border border-white/5">
                        We check your device to prevent fake accounts and keep our community safe. 
                        Your data is encrypted and automatically deleted after 90 days.
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Button - Disabled until checked */}
                  <motion.div whileHover={agreed ? { scale: 1.02 } : {}} whileTap={agreed ? { scale: 0.98 } : {}}>
                    <Button
                      onClick={() => {setStep("verifying"); verify()}}
                      disabled={!agreed}
                      className={`w-full h-12 font-semibold text-base rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden group ${agreed ? 'bg-linear-to-r from-rose-400 to-violet-500 hover:from-rose-500 hover:to-violet-600 text-white shadow-rose-500/25' : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'}`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {agreed ? "Complete Verification" : "Please agree to continue"}
                        {agreed && <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>}
                      </span>
                      {agreed && <div className="absolute inset-0 bg-linear-to-r from-violet-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                    </Button>
                  </motion.div>

                  {/* Microcopy */}
                  <p className="text-[10px] text-rose-200/50 text-center">
                    Your consent is recorded for security purposes
                  </p>
                </motion.div>
              )}

              {step === "verifying" && (
                <motion.div key="verifying" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center py-8 space-y-6">
                  <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-rose-300/30 border-t-rose-400 border-r-violet-400" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-2 border-violet-300/30 border-t-violet-400 border-r-rose-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-rose-300" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                  <p className="text-xs text-rose-100/70">Establishing secure connection...</p>
                </motion.div>
              )}

              {step === "complete" && (
                <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                  <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Successfully Verified</span>
                  </motion.div>
                  <motion.p className="mt-4 text-sm text-rose-100/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    Redirecting you back to Discord...
                  </motion.p>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                    <span className="text-2xl">😅</span>
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-white font-medium">Verification didn&apos;t complete</p>
                    <p className="text-xs text-rose-200/70">This might be a network issue or browser setting</p>
                  </div>
                  <Button onClick={() => window.location.reload()} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl px-6">
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-rose-200/50">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted • GDPR Compliant</span>
            </div>
          </CardContent>
        </Card>
        <div className="absolute -inset-1 bg-linear-to-r from-rose-400 to-violet-500 rounded-3xl blur opacity-20 -z-10 animate-pulse" />
      </motion.div>
    </div>
  )
}