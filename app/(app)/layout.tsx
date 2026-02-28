import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
