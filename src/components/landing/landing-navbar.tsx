import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { LandingNavbarClient } from "./landing-navbar-client"

export async function LandingNavbar() {
  const session = await getServerSession(authOptions)

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null

  return <LandingNavbarClient user={user} />
}
