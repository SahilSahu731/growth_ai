"use server"

import { createUser, findUserByEmail } from "@/lib/db"
import { hashPassword } from "@/lib/password"

export type AuthActionState = {
  error?: string
  success?: string
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

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Please fill in all required fields." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    return { error: "An account with this email already exists." }
  }

  const passwordHash = await hashPassword(password)

  await createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
  })

  return { success: "Account created successfully. You can sign in now." }
}
