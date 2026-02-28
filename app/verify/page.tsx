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
import { Loading } from "@/components/ui/loading"
import { AuroraBackground } from "@/components/layout/background"

type VerifyResponse = {
  success: boolean
  error?: string
}

type VerifyStatusResponse = {
  verified: boolean
}

async function callApi<T>(method: string, path: string, body?: object): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(errorBody.error || "Request failed")
  }

  return response.json()
}

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

  // Check verification status on load
  useEffect(() => {
    if (!initialized.current && status === "authenticated" && step === "loading") {
      initialized.current = true
      
      callApi<VerifyStatusResponse>("GET", "/api/verify/status")
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("discord", { callbackUrl: "/verify" })
    }
  }, [status])

  const verify = useCallback(async () => {
    if (verified.current) return
    verified.current = true

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.fillText("Cozy Heart", 0, 0)
      
      const userId = session?.user?.id
      if (!userId) throw new Error("User ID not found")
      
      const data = await callApi<VerifyResponse>("POST", "/api/verify", {
        userId,
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

  const handleRetry = () => {
    verified.current = false
    setStep("consent")
    setErrorMessage("")
    setConsents({ device: false, ip: false })
  }

  const toggleConsent = (key: keyof ConsentState) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Show loading while checking auth or verification status
  if (status === "loading" || step === "loading") {
    return <Loading text="Checking verification status..." />
  }

  const titles = {
    consent: "Welcome to Cozy Heart",
    verifying: "Securing...",
    complete: "You're in!",
    error: "Verification Failed"
  }

  const subtitles = {
    consent: `Hi ${session?.user?.name || 'there'}, help us keep our community safe`,
    verifying: "Checking your device...",
    complete: "Redirecting you to the main page...",
    error: "We couldn't complete your verification"
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
              {/* Animated Icon */}
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
                        {step === "complete" && <CheckCircle2 className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />}
                        {step === "error" && <AlertTriangle className="w-8 h-8 text-red-400" />}
                        {(step === "consent" || step === "verifying") && <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />}
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
                  {titles[step]}
                </motion.h1>
                <p className="text-sm text-zinc-400">{subtitles[step]}</p>
              </div>

              <Separator className="bg-white/8" />

              {/* Content Steps */}
              <AnimatePresence mode="wait">
                {step === "consent" && (
                  <ConsentForm 
                    session={session}
                    consents={consents}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    toggleConsent={toggleConsent}
                    canVerify={canVerify}
                    onVerify={() => {setStep("verifying"); verify()}}
                  />
                )}

                {step === "verifying" && <VerifyingState />}
                {step === "complete" && <CompleteState name={session?.user?.name} />}
                {step === "error" && <ErrorState message={errorMessage} onRetry={handleRetry} />}
              </AnimatePresence>

              {/* Footer */}
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

// Sub-components for clarity
import { Session } from "next-auth"

interface ConsentFormProps {
  session: Session | null
  consents: ConsentState
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleConsent: (key: keyof ConsentState) => void
  canVerify: boolean
  onVerify: () => void
}

function ConsentForm({ session, consents, isOpen, setIsOpen, toggleConsent, canVerify, onVerify }: ConsentFormProps) {
  const trustColors = {
    NEW: "bg-amber-500/20 text-amber-300",
    VERIFIED: "bg-emerald-500/20 text-emerald-300"
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex justify-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${trustColors[session?.user?.trust as keyof typeof trustColors] || "bg-blue-500/20 text-blue-300"}`}>
          {session?.user?.trust || "NEW"}
        </span>
        {session?.user?.verified && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300">Email Verified</span>
        )}
      </div>

      <ConsentItem 
        checked={consents.device}
        onClick={() => toggleConsent('device')}
        icon={Fingerprint}
        label="Verify my device *"
        description="I consent to browser fingerprinting for security"
      />

      <ConsentItem 
        checked={consents.ip}
        onClick={() => toggleConsent('ip')}
        icon={Wifi}
        label="Check my connection *"
        description="I consent to IP security checks"
      />

      <InfoCollapsible isOpen={isOpen} setIsOpen={setIsOpen} isAdmin={session?.user?.role === "ADMIN"} />

      <Button
        onClick={onVerify}
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
  )
}

interface ConsentItemProps {
  checked: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}

function ConsentItem({ checked, onClick, icon: Icon, label, description }: ConsentItemProps) {
  return (
    <motion.div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all duration-300 ${
        checked 
          ? 'bg-rose-500/10 border-rose-500/30' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Checkbox checked={checked} className="mt-1 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" />
      <div className="flex-1">
        <Label className="text-white font-medium flex items-center gap-2 cursor-pointer">
          <Icon className="w-4 h-4 text-rose-400" />
          {label}
        </Label>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </div>
    </motion.div>
  )
}

interface InfoCollapsibleProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isAdmin: boolean
}

function InfoCollapsible({ isOpen, setIsOpen, isAdmin }: InfoCollapsibleProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between text-zinc-400 hover:text-white hover:bg-white/5">
          <span className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" /> 
            Why do we need this?
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 bg-white/5 rounded-xl p-4 text-xs text-zinc-400 border border-white/10">
          We verify your device to prevent fake accounts and ensure a safe community. 
          Your data is encrypted and auto-deletes after 90 days.
          {isAdmin && <p className="mt-2 text-amber-400">Admin bypass available in settings.</p>}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function VerifyingState() {
  return (
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
  )
}

function CompleteState({ name }: { name?: string }) {
  return (
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
        Welcome{name ? `, ${name}` : ''}! 💜
      </p>
      <motion.div 
        className="h-1 w-32 bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full mx-auto"
        initial={{ width: 0 }}
        animate={{ width: 128 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </motion.div>
  )
}

function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Alert className="bg-red-500/10 border-red-500/20 text-white">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <AlertTitle className="text-red-200">Verification Failed</AlertTitle>
        <AlertDescription className="text-zinc-400">{message}</AlertDescription>
      </Alert>
      
      <div className="flex gap-3">
        <Button onClick={onRetry} className="flex-1 bg-white text-black hover:bg-zinc-200 font-semibold">
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
  )
}