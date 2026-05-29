import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const centers = ["Zona Austral", "Zona Centro Sur", "Softys", "Embotelladoras", "El Olivar", "Alfalfal", "Papeles Cordillera"];

  for (const name of centers) {
    await pool.query(`INSERT INTO "WorkCenter" (id, name, "createdAt") VALUES (gen_random_uuid(), $1, NOW()) ON CONFLICT (name) DO NOTHING`, [name]);
    console.log(`✓ Centro: ${name}`);
  }

  const users = [
    { name: "Admin Eco", email: "admin@eco.cl", pwd: "Admin123!", role: "ADMIN" },
    { name: "Luis Tasso", email: "conductor@eco.cl", pwd: "Conductor123!", role: "DRIVER" },
    { name: "Pedro Gómez", email: "supervisor@eco.cl", pwd: "Supervisor123!", role: "SUPERVISOR" },
    { name: "Carlos Muñoz", email: "mecanico@eco.cl", pwd: "Mecanico123!", role: "MECHANIC" },
    { name: "María Soto", email: "gerencia@eco.cl", pwd: "Gerencia123!", role: "MANAGER" },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email, password: u.pwd, email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        const { data: existing } = await supabase.auth.admin.listUsers();
        const found = existing.users.find(x => x.email === u.email);
        if (found) {
          await pool.query(
            `INSERT INTO "User" (id, name, email, role, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = $2, role = $4`,
            [found.id, u.name, u.email, u.role]
          );
          console.log(`✓ ${u.email} (${u.role}) - updated`);
        }
      } else {
        console.error(`✗ ${u.email}: ${error.message}`);
      }
      continue;
    }

    await pool.query(
      `INSERT INTO "User" (id, name, email, role, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = $2, role = $4`,
      [data.user.id, u.name, u.email, u.role]
    );
    console.log(`✓ ${u.email} (${u.role})`);
  }

  await pool.end();
}

main();
