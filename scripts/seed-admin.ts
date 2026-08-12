import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "../server/database/schema"

if (!process.env.NUXT_DSN) throw new Error("NUXT_DSN ist nicht gesetzt!")

const client = new pg.Client({ connectionString: process.env.NUXT_DSN })
await client.connect()
const db = drizzle(client, { schema, casing: "snake_case" })

// Bun.password.hash ist eingebaut – kein argon2-Import nötig
const passwordHash = await Bun.password.hash(process.env.ADMIN_PASSWORD!, {
  algorithm: "argon2id"
})

// 1. Organisation anlegen
const [org] = await db.insert(schema.organisations).values({
  name: process.env.ORG_NAME!,
}).returning()

console.log("✅ Organisation angelegt:", org)

// 2. Admin-User anlegen
const [user] = await db.insert(schema.users).values({
  email: process.env.ADMIN_EMAIL!,
  passwordHash,
  organisationId: org.id,
  role: "owner",
}).returning()

console.log("✅ Admin-Account angelegt:", user.email)
await client.end()
