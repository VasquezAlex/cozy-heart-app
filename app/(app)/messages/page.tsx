import Link from "next/link"

export default function MessagesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="text-muted-foreground">Your conversations will appear here soon.</p>
      <Link href="/seeking" className="text-primary underline underline-offset-4">
        Back to Discover
      </Link>
    </section>
  )
}
