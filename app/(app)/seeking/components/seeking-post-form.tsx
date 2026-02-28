"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type LookingFor = "friends" | "dating" | "serious" | "gaming" | "chat"

export function SeekingPostForm() {
  const [showForm, setShowForm] = useState(false)
  const [headline, setHeadline] = useState("")
  const [message, setMessage] = useState("")
  const [lookingFor, setLookingFor] = useState<LookingFor>("friends")
  const [minAge, setMinAge] = useState("18")
  const [maxAge, setMaxAge] = useState("30")
  const [region, setRegion] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [availability, setAvailability] = useState("")
  const [dealBreakers, setDealBreakers] = useState("")
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function submitPost() {
    if (headline.trim().length < 5) {
      setError("Headline must be at least 5 characters")
      return
    }

    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters")
      return
    }

    setPosting(true)
    setError("")
    setSuccess("")

    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      const min = Number.parseInt(minAge, 10)
      const max = Number.parseInt(maxAge, 10)

      const response = await fetch("/api/seeking/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          message,
          lookingFor,
          minAge: Number.isNaN(min) ? undefined : min,
          maxAge: Number.isNaN(max) ? undefined : max,
          region: region || undefined,
          tags,
          availability: availability || undefined,
          dealBreakers: dealBreakers || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to post")
      }

      setSuccess("Your seeking message is live.")
      setShowForm(false)
      setHeadline("")
      setMessage("")
      setLookingFor("friends")
      setMinAge("18")
      setMaxAge("30")
      setRegion("")
      setTagsInput("")
      setAvailability("")
      setDealBreakers("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post seeking message")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">Discover</h1>
        <Button
          onClick={() => {
            setShowForm((prev) => !prev)
            setError("")
            setSuccess("")
          }}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          {showForm ? "Close" : "Post Seeking"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-zinc-950/65 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-5 backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-white font-semibold">Post your seeking message</p>
            <p className="text-xs text-zinc-400">Add detail so the right people can discover you faster.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Headline</Label>
            <Input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Example: Looking for late-night gaming friends"
              className="bg-black/40 border-white/10 text-white"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Message</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe what kind of connection you're looking for, what you're into, and what you're hoping to find."
              className="w-full min-h-32 rounded-md border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-rose-500/40"
              maxLength={500}
            />
            <p className="text-[11px] text-zinc-500">{message.length}/500</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Looking for</Label>
              <Select
                value={lookingFor}
                onValueChange={(value) => setLookingFor(value as LookingFor)}
              >
                <SelectTrigger className="w-full bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="dating">Dating</SelectItem>
                  <SelectItem value="serious">Serious Relationship</SelectItem>
                  <SelectItem value="gaming">Gaming Buddy</SelectItem>
                  <SelectItem value="chat">Just Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Region</Label>
              <Input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Region (e.g. Manila)"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Preferred age range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={minAge}
                  onChange={(event) => setMinAge(event.target.value)}
                  placeholder="Min"
                  className="bg-black/40 border-white/10 text-white"
                />
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={maxAge}
                  onChange={(event) => setMaxAge(event.target.value)}
                  placeholder="Max"
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Tags</Label>
              <Input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="anime, movies, gym (comma-separated)"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Availability (optional)</Label>
              <Input
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                placeholder="Weeknights / weekends"
                className="bg-black/40 border-white/10 text-white"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Deal-breakers (optional)</Label>
              <Input
                value={dealBreakers}
                onChange={(event) => setDealBreakers(event.target.value)}
                placeholder="Smoking, ghosting, etc."
                className="bg-black/40 border-white/10 text-white"
                maxLength={180}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-zinc-400">Tip: concise, specific posts get better responses.</p>
            <Button onClick={submitPost} disabled={posting} className="bg-rose-500 hover:bg-rose-600 text-white">
              {posting ? "Posting..." : "Publish"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {success && <div className="text-sm text-emerald-400">{success}</div>}
    </div>
  )
}
