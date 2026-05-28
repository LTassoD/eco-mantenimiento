import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) redirect("/login");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="font-heading font-bold text-2xl text-brand-blue mb-2">
        Bienvenido, {dbUser.name}
      </h2>
      <p className="text-brand-gray/60 mb-8">
        Panel de {dbUser.role === "ADMIN" ? "Administración" :
                  dbUser.role === "DRIVER" ? "Conductor" :
                  dbUser.role === "SUPERVISOR" ? "Supervisor" :
                  dbUser.role === "MECHANIC" ? "Mecánico" : "Gerencia"}
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["ADMIN", "DRIVER", "SUPERVISOR"].includes(dbUser.role) && (
          <Card
            title="Checklist Diario"
            desc="Registra el estado del vehículo al inicio del turno"
            href="/checklist"
            color="brand-blue"
          />
        )}
        {["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role) && (
          <Card
            title="Órdenes de Mantenimiento"
            desc="Gestiona y da seguimiento a reparaciones"
            href="/maintenance"
            color="brand-green"
          />
        )}
        {["ADMIN", "MANAGER"].includes(dbUser.role) && (
          <Card
            title="Reportes"
            desc="KPIs, alertas e indicadores de flota"
            href="/reports"
            color="#454545"
          />
        )}
        {dbUser.role === "ADMIN" && (
          <Card
            title="Usuarios"
            desc="Administra conductores, supervisores y mecánicos"
            href="/admin/users"
            color="#021793"
          />
        )}
      </div>
    </div>
  );
}

function Card({ title, desc, href, color }: {
  title: string; desc: string; href: string; color: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
    >
      <h3 className="font-heading font-bold text-lg mb-1" style={{ color }}>
        {title}
      </h3>
      <p className="text-brand-gray/70 text-sm">{desc}</p>
    </a>
  );
}
