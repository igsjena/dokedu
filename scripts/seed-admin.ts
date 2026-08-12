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
  ssl: true,
})

await client.connect()
console.log("✅ Datenbankverbindung erfolgreich")

const db = drizzle(client, { schema, casing: "snake_case" })

const passwordHash = await Bun.password.hash(process.env.ADMIN_PASSWORD!, {
  algorithm: "argon2id",
})

const [org] = await db.insert(schema.organisations).values({
  name: process.env.ORG_NAME!,
}).returning()
console.log("✅ Organisation angelegt:", org.id)

const [user] = await db.insert(schema.users).values({
  email: process.env.ADMIN_EMAIL!,
  passwordHash,
  organisationId: org.id,
  role: "owner",
}).returning()
console.log("✅ Admin angelegt:", user.email)

await client.end()
