import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"

export async function getSession() {
  return auth()
}

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return session
}
