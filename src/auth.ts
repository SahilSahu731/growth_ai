import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

import { getGoogleOAuthConfig } from "@/lib/oauth-config"
import { findUserByEmail, upsertOAuthUser } from "@/lib/data/users"

const providers: NonNullable<NextAuthOptions["providers"]> = []
const googleOAuth = getGoogleOAuthConfig()

if (googleOAuth.enabled && googleOAuth.clientId && googleOAuth.clientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleOAuth.clientId,
      clientSecret: googleOAuth.clientSecret,
    })
  )
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const appUser = await upsertOAuthUser({
            email: user.email,
            name: user.name,
            provider: "google",
          })
          if (appUser.deletedAt) return false
        } catch (error) {
          console.error("Failed to persist OAuth user", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      const email = user?.email ?? (typeof token.email === "string" ? token.email : null)
      if (email) {
        const appUser = await findUserByEmail(email)
        // Re-check the backing account on every session read so an admin access
        // suspension takes effect without waiting for the JWT to expire.
        token.userId = appUser && !appUser.deletedAt ? appUser.id : undefined
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? ""
      }

      return session
    },
  },
}
