// lib/auth/index.ts
import NextAuth from "next-auth"
import { authConfig } from "./config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Helper function
export async function requireAuth(allowedRoles?: string[]) {
  const session = await auth()
  
  if (!session) {
    throw new Error("Unauthorized")
  }
  
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden")
  }
  
  return session
}