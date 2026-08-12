import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "../server/database/schema"

if (!process.env.DB_HOST) throw new Error("DB_HOST ist nicht gesetzt!")
if (!process.env.DB_PASSWORD) throw new Error("DB_PASSWORD ist nicht gesetzt!")

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: 5432,
  database: "postgres",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log("✅ Datenbankverbindung erfolgreich")

const db = drizzle(client, { schema, casing: "snake_case" })

// Doppelte Organisationen vermeiden: erst prüfen ob schon eine existiert
const existingOrgs = await db.select().from(schema.organisations)
let orgId: string

if (existingOrgs.length > 0) {
  orgId = existingOrgs[0].id
  console.log("ℹ️ Bestehende Organisation gefunden:", orgId)
} else {
  const [org] = await db.insert(schema.organisations).values({
    name: process.env.ORG_NAME!,
  }).returning()
  orgId = org.id
  console.log("✅ Organisation angelegt:", orgId)
}

// Passwort hashen
const password = await Bun.password.hash(process.env.ADMIN_PASSWORD!, {
  algorithm: "argon2id",
})

// User anlegen
const [user] = await db.insert(schema.users).values({
  email: process.env.ADMIN_EMAIL!,
  password,
  firstName: "Admin",
  lastName: "User",
  organisationId: orgId,
  role: "owner",
}).returning()

console.log("✅ Admin-Account angelegt:", user.email)
await client.end()
