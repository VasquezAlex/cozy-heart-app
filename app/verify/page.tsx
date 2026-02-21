"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { signIn, useSession } from "next-auth/react"
import { Heart, Shield, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function VerifyPage() {
  const { status } = useSession()
  const [message, setMessage] = useState("Connecting...")
  const [subMessage, setSubMessage] = useState("")
  const verified = useRef(false)

  const verify = useCallback(async () => {
    if (verified.current) return
    verified.current = true
    
    try {
      setMessage("Analyzing...")
      
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      ctx?.fillText("Cozy Heart", 0, 0)
      
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DeviceData: [
            canvas.toDataURL(),
            navigator.hardwareConcurrency,
            navigator.language,
            screen.width,
            new Date().getTimezoneOffset()
          ]
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        setMessage(data.warning ? "Verified (Shared device)" : "Welcome!")
        setSubMessage(data.warning ? "Device previously used" : "You're all set!")
        setTimeout(() => window.close(), 2000)
      } else {
        setMessage("Failed")
        setSubMessage(data.error || "Try again")
      }
    } catch {
      setMessage("Error")
      setSubMessage("Check connection")
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("discord", { callbackUrl: "/verify" })
    } else if (status === "authenticated") {
      setTimeout(verify, 0)
    }
  }, [status, verify])

  const isLoading = status === "loading" || (!message.includes("Welcome") && !message.includes("Failed") && !message.includes("Error"))
  const isSuccess = message.includes("Welcome") || message.includes("Verified")
  const isError = message.includes("Failed") || message.includes("Error")

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F4B942 0%, #E8A838 50%, #C4622B 100%)" }}
    >
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255, 179, 71, 0.4) 0%, transparent 70%)" }}
      />
      
      {/* Floating hearts */}
      <Heart className="absolute top-10 left-10 w-8 h-8 opacity-20 animate-pulse text-[#FF7F6B] fill-[#FF7F6B]" />
      <Heart className="absolute bottom-20 right-10 w-12 h-12 opacity-20 animate-pulse delay-700 text-[#FF7F6B] fill-[#FF7F6B]" />

      {/* Main Card */}
      <Card 
        className="w-full max-w-md backdrop-blur-sm border-2 shadow-2xl"
        style={{ 
          backgroundColor: "rgba(245, 230, 211, 0.95)", 
          borderColor: "rgba(196, 98, 43, 0.4)" 
        }}
      >
        {/* Top gradient bar */}
        <div 
          className="h-2 w-full rounded-t-lg" 
          style={{ background: "linear-gradient(to right, #C4622B, #FF7F6B, #C4622B)" }}
        />
        
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div 
              className="absolute inset-0 rounded-full animate-pulse opacity-30" 
              style={{ backgroundColor: "#FFB347" }}
            />
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center shadow-lg border-4"
              style={{ 
                background: "linear-gradient(135deg, #F4B942, #FF7F6B)",
                borderColor: "#F5E6D3"
              }}
            >
              <Heart 
                className={`w-12 h-12 ${isLoading ? "animate-bounce" : ""}`} 
                style={{ color: "#3E2723", fill: "#FFF8E7" }}
              />
              {isLoading && (
                <Badge 
                  className="absolute -bottom-1 -right-1 border-0 text-xs font-bold"
                  style={{ backgroundColor: "#C4622B", color: "#FFF8E7" }}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  BOT
                </Badge>
              )}
            </div>
          </div>
          
          <CardTitle className="text-2xl" style={{ color: "#3E2723" }}>Cozy Heart</CardTitle>
          <CardDescription className="text-lg font-semibold" style={{ color: "#6B4423" }}>
            {message}
          </CardDescription>
          {subMessage && (
            <p className="text-sm opacity-80" style={{ color: "#6B4423" }}>{subMessage}</p>
          )}
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4 pb-6">
          {/* Status Icon */}
          {isSuccess ? (
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: "rgba(255, 179, 71, 0.3)", borderColor: "#FFB347" }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: "#C4622B" }} />
            </div>
          ) : isError ? (
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: "rgba(255, 127, 107, 0.2)", borderColor: "#FF7F6B" }}
            >
              <AlertCircle className="w-7 h-7" style={{ color: "#C4622B" }} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C4622B" }} />
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#C4622B" }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#C4622B", animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#C4622B", animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Actions */}
          {isError && (
            <Button 
              onClick={() => window.location.reload()}
              className="text-[#FFF8E7] hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(to right, #C4622B, #FF7F6B)" }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}

          {isSuccess && (
            <Badge 
              variant="secondary" 
              className="hover:bg-[#FFB347]/50"
              style={{ backgroundColor: "rgba(255, 179, 71, 0.4)", color: "#A0522D" }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Done
            </Badge>
          )}

          <p className="text-xs opacity-60" style={{ color: "#6B4423" }}>Protected by Cozy Ward</p>
        </CardContent>
      </Card>
    </div>
  )
}