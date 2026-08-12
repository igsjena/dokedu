import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "../server/database/schema"

if (!process.env.NUXT_DSN) throw new Error("NUXT_DSN ist nicht gesetzt!")

// URL manuell parsen – umgeht den fehlerhaften pg-connection-string-Parser
const url = new URL(process.env.NUXT_DSN)
const client = new pg.Client({
  host: url.hostname,
  port: Number(url.port) || 5432,
  database: url.pathname.slice(1),
  user: url.username,
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log("✅ Datenbankverbindung erfolgreich")

const db = drizzle(client, { schema, casing: "snake_case" })

// Passwort hashen (Bun-built-in, kein argon2-Import nötig)
const passwordHash = await Bun.password.hash(process.env.ADMIN_PASSWORD!, {
  algorithm: "argon2id",
})

// 1. Organisation anlegen
const [org] = await db.insert(schema.organisations).values({
  name: process.env.ORG_NAME!,
}).returning()
console.log("✅ Organisation angelegt:", org.id)

// 2. Admin-User anlegen
const [user] = await db.insert(schema.users).values({
  email: process.env.ADMIN_EMAIL!,
  passwordHash,
  organisationId: org.id,
  role: "owner",
}).returning()
console.log("✅ Admin-Account angelegt:", user.email)

await client.end()
