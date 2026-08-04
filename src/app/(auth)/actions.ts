"use server"

import { createUser, findUserByEmail } from "@/lib/data/users"
import { hashPassword } from "@/lib/password"
import { claimReferral } from "@/lib/data/growth"

export type AuthActionState = {
  error?: string
  success?: string
  email?: string
}

function parseText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = parseText(formData.get("name"))
  const email = parseText(formData.get("email")).toLowerCase()
  const password = parseText(formData.get("password"))
  const confirmPassword = parseText(formData.get("confirmPassword"))
  const referralCode = parseText(formData.get("referralCode"))

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Please fill in all required fields." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  try {
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return { error: "An account with this email already exists." }
    }

    const passwordHash = await hashPassword(password)

    const created = await createUser({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
    })
    if (referralCode) await claimReferral(referralCode, created.id).catch(error => console.error("Referral attribution failed", error))

    return {
      success: "Account created successfully.",
      email,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("CONVEX")) {
      return {
        error: "Database is not configured. Add your Convex URL and deploy key to .env.local.",
      }
    }

    console.error("Signup failed", error)
    return {
      error: "Unable to create account right now. Please try again.",
    }
  }
}
