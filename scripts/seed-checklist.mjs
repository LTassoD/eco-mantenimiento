import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Crear template
  const { rows: [template] } = await pool.query(
    `INSERT INTO "ChecklistTemplate" (id, name, description, "isActive", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), 'Checklist Diario', 'Inspección diaria del vehículo antes de operar', true, NOW(), NOW())
     RETURNING id`
  );
  const templateId = template.id;

  const items = [
    { cat: "Motor", name: "Nivel de aceite motor", order: 1 },
    { cat: "Motor", name: "Nivel de refrigerante", order: 2 },
    { cat: "Motor", name: "Fugas de aceite o líquidos", order: 3 },
    { cat: "Neumáticos", name: "Presión de neumáticos", order: 4 },
    { cat: "Neumáticos", name: "Estado de neumáticos (desgaste)", order: 5 },
    { cat: "Neumáticos", name: "Rueda de repuesto", order: 6 },
    { cat: "Luces", name: "Luces delanteras (altas/bajas)", order: 7 },
    { cat: "Luces", name: "Luces traseras y stop", order: 8 },
    { cat: "Luces", name: "Direccionales", order: 9 },
    { cat: "Luces", name: "Luces de estacionamiento", order: 10 },
    { cat: "Frenos", name: "Freno de servicio", order: 11 },
    { cat: "Frenos", name: "Freno de estacionamiento", order: 12 },
    { cat: "Carrocería", name: "Espejos retrovisores", order: 13 },
    { cat: "Carrocería", name: "Limpiaparabrisas", order: 14 },
    { cat: "Carrocería", name: "Estado de carrocería (golpes/rayones)", order: 15 },
    { cat: "Seguridad", name: "Extintor con carga vigente", order: 16 },
    { cat: "Seguridad", name: "Botiquín de primeros auxilios", order: 17 },
    { cat: "Seguridad", name: "Triángulos de seguridad", order: 18 },
    { cat: "Cabina", name: "Cinturones de seguridad", order: 19 },
    { cat: "Cabina", name: "Tablero de instrumentos", order: 20 },
    { cat: "Cabina", name: "Limpieza general de cabina", order: 21 },
  ];

  for (const item of items) {
    await pool.query(
      `INSERT INTO "ChecklistItem" (id, "templateId", category, name, "order", "isRequired", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())`,
      [templateId, item.cat, item.name, item.order]
    );
  }

  console.log(`✓ Template creado con ${items.length} items`);
  await pool.end();
}

main();
