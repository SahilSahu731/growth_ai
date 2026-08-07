"use server"

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/auth"
import { acceptLegalNotices } from "@/lib/data/account"
import { LEGAL_VERSIONS } from "@/lib/legal"

export async function acceptLegalAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/consent")
  if (formData.get("age") !== "yes" || formData.get("terms") !== "yes" || formData.get("ai") !== "yes") redirect("/consent?error=required")
  await acceptLegalNotices(session.user.id, { termsVersion: LEGAL_VERSIONS.terms, privacyVersion: LEGAL_VERSIONS.privacy, aiNoticeVersion: LEGAL_VERSIONS.aiNotice })
  redirect("/chat")
}
