import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import argon2 from "argon2"
// Schema importieren damit Drizzle die Tabellen kennt
import * as schema from "../server/database/schema"

const client = new pg.Client({ connectionString: process.env.NUXT_DSN })
await client.connect()
const db = drizzle(client, { schema, casing: "snake_case" })

// 1. Organisation anlegen
const [org] = await db.insert(schema.organisations).values({
  name: process.env.ORG_NAME!,
}).returning()

// 2. Admin-User anlegen
const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD!)
await db.insert(schema.users).values({
  email: process.env.ADMIN_EMAIL!,
  passwordHash,
  organisationId: org.id,
  role: "owner",  // oder "admin" – je nach Schema
}).returning()

console.log("✅ Admin-Account angelegt:", process.env.ADMIN_EMAIL)
await client.end()
