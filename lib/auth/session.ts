import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"

export async function getAuthSession() {
  return auth()
}

export async function requireSession() {
  const session = await getAuthSession()

  if (!session) {
    redirect("/")
  }

  return session
}
