import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) redirect("/login");

  const vehiclesDue = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      kmServiceInterval: { not: null },
    },
    include: { driver: true, workCenter: true },
  });

  const alerts = vehiclesDue
    .map(v => ({
      ...v,
      nextServiceKm: v.nextServiceKm ?? v.currentKm + v.kmServiceInterval!,
      kmRemaining: (v.nextServiceKm ?? v.currentKm + v.kmServiceInterval!) - v.currentKm,
    }))
    .filter(v => v.kmRemaining <= 500)
    .sort((a, b) => a.kmRemaining - b.kmRemaining);

  const dueCount = alerts.filter(a => a.kmRemaining <= 0).length;
  const soonCount = alerts.filter(a => a.kmRemaining > 0).length;

  const totalVehicles = await prisma.vehicle.count();
  const activeVehicles = await prisma.vehicle.count({ where: { isActive: true } });
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const checklistsMonth = await prisma.checklist.count({ where: { createdAt: { gte: startOfMonth } } });
  const openTickets = await prisma.maintenanceTicket.count({ where: { status: { not: "CLOSED" } } });
  const closedTickets = await prisma.maintenanceTicket.count({ where: { status: "CLOSED" } });
  const costAgg = await prisma.maintenancePart.aggregate({ _sum: { totalCost: true } });
  const totalCost = costAgg._sum.totalCost ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-2">
        Bienvenido, {dbUser.name}
      </h2>
      <p className="text-brand-gray/60 text-lg mb-10">
        Panel de {dbUser.role === "ADMIN" ? "Administración" :
                  dbUser.role === "DRIVER" ? "Conductor" :
                  dbUser.role === "SUPERVISOR" ? "Supervisor" :
                  dbUser.role === "MECHANIC" ? "Mecánico" : "Gerencia"}
      </p>

      {dbUser.role === "MANAGER" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KpiCard label="Flota Activa" value={`${activeVehicles}/${totalVehicles}`} sub="vehículos" color="brand-blue" />
          <KpiCard label="Checklists del Mes" value={checklistsMonth} sub="realizados" color="brand-green" />
          <KpiCard label="Mantenimiento" value={`${openTickets} abiertos`} sub={`${closedTickets} cerrados`} color="brand-neon" />
          <KpiCard label="Costo Total" value={`$${totalCost.toLocaleString()}`} sub="en repuestos" color="#454545" />
        </div>
      )}

      {["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role) && alerts.length > 0 && (
        <div className="mb-10 space-y-3">
          <h3 className="font-heading font-bold text-xl text-brand-blue">
            Alertas de mantenimiento
            {dueCount > 0 && <span className="ml-2 text-sm font-normal text-red-500">({dueCount} vencido{ dueCount !== 1 ? "s" : ""})</span>}
            {soonCount > 0 && <span className="ml-2 text-sm font-normal text-yellow-600">({soonCount} próximo{ soonCount !== 1 ? "s" : ""})</span>}
          </h3>
          <div className="space-y-2">
            {alerts.map(a => (
              <a key={a.id} href={`/vehiculos/${a.id}`}
                className={`block bg-white rounded-xl border px-5 py-3 hover:shadow-sm transition ${
                  a.kmRemaining <= 0 ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{a.plate}</span>
                    <span className="text-brand-gray/60 ml-3">{a.brand} {a.model}</span>
                    {a.driver && <span className="text-brand-gray/60 ml-3">· {a.driver.name}</span>}
                  </div>
                  <span className={`text-sm font-bold ${a.kmRemaining <= 0 ? "text-red-600" : "text-yellow-700"}`}>
                    {a.kmRemaining <= 0
                      ? `VENCIDO (${Math.abs(a.kmRemaining).toLocaleString()} km excedidos)`
                      : `${a.kmRemaining.toLocaleString()} km restantes`}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {["ADMIN", "DRIVER", "SUPERVISOR"].includes(dbUser.role) && (
          <Card title="Checklist Diario" desc="Registra el estado del vehículo al inicio del turno" href="/checklist" color="brand-blue" />
        )}
        {["ADMIN", "SUPERVISOR"].includes(dbUser.role) && (
          <Card title="Vehículos" desc="Administra camiones y asigna centros de trabajo" href="/vehiculos" color="brand-green" />
        )}
        {["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role) && (
          <Card title="Órdenes de Mantenimiento" desc="Gestiona y da seguimiento a reparaciones" href="/maintenance" color="brand-green" />
        )}
        {["ADMIN", "MANAGER"].includes(dbUser.role) && (
          <Card title="Reportes" desc="KPIs, alertas e indicadores de flota" href="/reports" color="#454545" />
        )}
        {["ADMIN", "SUPERVISOR"].includes(dbUser.role) && (
          <Card title="Usuarios" desc="Administra conductores, supervisores y mecánicos" href="/admin/users" color="#021793" />
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-brand-gray/60 text-sm font-medium mb-1">{label}</p>
      <p className="font-heading font-bold text-2xl mb-1" style={{ color }}>{value}</p>
      <p className="text-brand-gray/50 text-xs">{sub}</p>
    </div>
  );
}

function Card({ title, desc, href, color }: {
  title: string; desc: string; href: string; color: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition"
    >
      <h3 className="font-heading font-bold text-xl mb-2" style={{ color }}>
        {title}
      </h3>
      <p className="text-brand-gray/70 text-base">{desc}</p>
    </a>
  );
}
