import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

import { getGoogleOAuthConfig } from "@/lib/oauth-config"
import { findUserByEmail, upsertOAuthUser } from "@/lib/data/users"
import { safeErrorForLog } from "@/lib/safe-log"

const providers: NonNullable<NextAuthOptions["providers"]> = []
const googleOAuth = getGoogleOAuthConfig()

function isActiveAppUser(user: Awaited<ReturnType<typeof findUserByEmail>>) {
  return Boolean(user && !user.deletedAt && (!user.accountStatus || user.accountStatus === "active"))
}

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
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email || !account.providerAccountId) return false
        try {
          const emailVerified = Boolean(profile && "email_verified" in profile && profile.email_verified === true)
          const locale = profile && "locale" in profile && typeof profile.locale === "string" ? profile.locale : undefined
          const appUser = await upsertOAuthUser({
            email: user.email,
            name: user.name,
            provider: "google",
            providerAccountId: account.providerAccountId,
            emailVerified,
            locale,
          })
          // accountStatus is optional while the additive Convex release rolls
          // out. A legacy record is active unless deletedAt says otherwise.
          if (!isActiveAppUser(appUser)) return false
        } catch (error) {
          console.error("Failed to persist OAuth user", safeErrorForLog(error))
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) token.authenticatedAt = Date.now()
      const email = user?.email ?? (typeof token.email === "string" ? token.email : null)
      if (email) {
        try {
          const appUser = await findUserByEmail(email)
          // Re-check the backing account on every session read so an admin
          // suspension takes effect without waiting for JWT expiry. Legacy
          // records without accountStatus remain compatible during rollout.
          token.userId = isActiveAppUser(appUser) ? appUser?.id : undefined
        } catch (error) {
          // A temporary Convex/schema rollout failure must not erase an already
          // validated session and bounce the browser between /login and /chat.
          // New sessions still fail closed because they have no existing ID.
          console.error("Could not refresh member account state", safeErrorForLog(error))
          if (!token.userId) token.userId = undefined
        }
      }

      return token
    },
    async session({ session, token }) {
      session.authenticatedAt = token.authenticatedAt
      if (session.user) {
        session.user.id = token.userId ?? ""
      }

      return session
    },
  },
}
