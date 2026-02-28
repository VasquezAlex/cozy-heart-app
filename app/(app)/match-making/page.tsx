import Link from "next/link"

export default function MatchMakingPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Matches</h1>
      <p className="text-muted-foreground">Your match list will appear here soon.</p>
      <Link href="/seeking" className="text-primary underline underline-offset-4">
        Back to Discover
      </Link>
    </section>
  )
}
