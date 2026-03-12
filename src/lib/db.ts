import { neon } from "@neondatabase/serverless"

export type AppUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.")
  }

  return neon(databaseUrl)
}

let isAuthSchemaReady = false

export async function ensureAuthSchema(): Promise<void> {
  if (isAuthSchemaReady) return

  const sql = getSqlClient()

  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  isAuthSchemaReady = true
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  await ensureAuthSchema()

  const sql = getSqlClient()
  const normalizedEmail = email.trim().toLowerCase()

  const rows = (await sql`
    SELECT id, name, email, password_hash, created_at
    FROM app_users
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `) as Array<{
    id: string
    name: string
    email: string
    password_hash: string
    created_at: string
  }>

  const user = rows[0]

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    createdAt: user.created_at,
  }
}

export async function createUser(input: {
  id: string
  name: string
  email: string
  passwordHash: string
}): Promise<AppUser> {
  await ensureAuthSchema()

  const sql = getSqlClient()
  const normalizedEmail = input.email.trim().toLowerCase()

  const rows = (await sql`
    INSERT INTO app_users (id, name, email, password_hash)
    VALUES (${input.id}, ${input.name}, ${normalizedEmail}, ${input.passwordHash})
    RETURNING id, name, email, password_hash, created_at;
  `) as Array<{
    id: string
    name: string
    email: string
    password_hash: string
    created_at: string
  }>

  const user = rows[0]

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    createdAt: user.created_at,
  }
}
