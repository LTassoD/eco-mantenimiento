import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ReportsCharts } from "./charts.client";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "MANAGER"].includes(dbUser.role)) redirect("/dashboard");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const totalVehicles = await prisma.vehicle.count();
  const activeVehicles = await prisma.vehicle.count({ where: { isActive: true } });
  const inactiveVehicles = totalVehicles - activeVehicles;

  const checklistsMonth = await prisma.checklist.count({ where: { createdAt: { gte: startOfMonth } } });
  const totalTickets = await prisma.maintenanceTicket.count();
  const ticketsByStatus = await prisma.maintenanceTicket.groupBy({
    by: ["status"],
    _count: true,
  });
  const ticketsByMonth = await prisma.maintenanceTicket.findMany({
    where: { createdAt: { gte: startOfYear } },
    select: { createdAt: true },
  });

  const checklistsByCenter = await prisma.checklist.findMany({
    where: { createdAt: { gte: startOfMonth } },
    include: { vehicle: { select: { workCenter: { select: { name: true } } } } },
  });

  const costAgg = await prisma.maintenancePart.aggregate({ _sum: { totalCost: true } });
  const totalCost = costAgg._sum.totalCost ?? 0;

  const centers = await prisma.workCenter.findMany({ orderBy: { name: "asc" } });

  const centerChecklistCount: Record<string, number> = {};
  for (const c of checklistsByCenter) {
    const name = c.vehicle.workCenter?.name ?? "Sin centro";
    centerChecklistCount[name] = (centerChecklistCount[name] ?? 0) + 1;
  }

  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const ticketsPerMonth: Record<string, number> = {};
  for (const t of ticketsByMonth) {
    const key = months[t.createdAt.getMonth()];
    ticketsPerMonth[key] = (ticketsPerMonth[key] ?? 0) + 1;
  }

  const checklistByCenterData = Object.entries(centerChecklistCount).map(([name, count]) => ({ name, count }));
  const ticketsByMonthData = months.map(m => ({ month: m, count: ticketsPerMonth[m] ?? 0 }));

  const ticketStatusLabels: Record<string, string> = {
    OPEN: "Abierto",
    IN_PROGRESS: "En progreso",
    WAITING_PARTS: "Esperando repuestos",
    RESOLVED: "Resuelto",
    CLOSED: "Cerrado",
  };
  const ticketsByStatusData = ticketsByStatus.map(s => ({
    name: ticketStatusLabels[s.status] ?? s.status,
    count: s._count,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-2">Reportes</h2>
      <p className="text-brand-gray/60 text-lg mb-8">Indicadores y KPIs de flota</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard label="Flota Activa" value={`${activeVehicles}/${totalVehicles}`} sub="vehículos" />
        <KpiCard label="Checklists del Mes" value={checklistsMonth} sub="realizados" />
        <KpiCard label="Órdenes de Mtto" value={totalTickets} sub="totales" />
        <KpiCard label="Costo en Repuestos" value={`$${totalCost.toLocaleString()}`} sub="acumulado" />
      </div>

      <ReportsCharts
        fleetData={[
          { name: "Activos", value: activeVehicles },
          { name: "Inactivos", value: inactiveVehicles },
        ]}
        checklistByCenterData={checklistByCenterData}
        ticketsByStatusData={ticketsByStatusData}
        ticketsByMonthData={ticketsByMonthData}
      />
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-brand-gray/60 text-sm font-medium mb-1">{label}</p>
      <p className="font-heading font-bold text-2xl mb-1 text-brand-blue">{value}</p>
      <p className="text-brand-gray/50 text-xs">{sub}</p>
    </div>
  );
}
