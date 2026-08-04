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
          await upsertOAuthUser({
            email: user.email,
            name: user.name,
            provider: "google",
          })
        } catch (error) {
          console.error("Failed to persist OAuth user", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const appUser = await findUserByEmail(user.email)

        token.userId = appUser?.id ?? user.id
      } else if (!token.userId && typeof token.email === "string") {
        const appUser = await findUserByEmail(token.email)

        if (appUser) {
          token.userId = appUser.id
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId
      }

      return session
    },
  },
}
