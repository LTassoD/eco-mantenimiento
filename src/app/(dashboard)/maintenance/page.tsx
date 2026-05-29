import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const priorityLabel: Record<string, string> = {
  LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica",
};
const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-yellow-100 text-yellow-700",
  CRITICAL: "bg-red-100 text-red-700",
};
const statusLabel: Record<string, string> = {
  OPEN: "Abierto", IN_PROGRESS: "En progreso",
  WAITING_PARTS: "Esperando repuestos", RESOLVED: "Resuelto", CLOSED: "Cerrado",
};
const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_PARTS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};
const typeLabel: Record<string, string> = {
  PREVENTIVE: "Preventivo", CORRECTIVE: "Correctivo", INSPECTION: "Inspección",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; order?: string }>;
}) {
  const { status: filterStatus, order } = await searchParams;
  const sortOrder = order === "asc" ? "asc" : "desc";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role)) redirect("/dashboard");

  const where: any = {};
  if (filterStatus && filterStatus !== "ALL") where.status = filterStatus;

  const tickets = await prisma.maintenanceTicket.findMany({
    where,
    include: { vehicle: true, reportedBy: true, assignedTo: true },
    orderBy: { createdAt: sortOrder },
  });

  const statuses = [
    { key: "ALL", label: "Todas" },
    { key: "OPEN", label: "Abierto" },
    { key: "IN_PROGRESS", label: "En progreso" },
    { key: "WAITING_PARTS", label: "Esperando repuestos" },
    { key: "RESOLVED", label: "Resuelto" },
    { key: "CLOSED", label: "Cerrado" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Mantenimiento</h2>
        <a href="/maintenance/nuevo" className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
          + Nueva orden
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map((s) => {
          const active = (!filterStatus && s.key === "ALL") || filterStatus === s.key;
          const params = new URLSearchParams();
          if (s.key !== "ALL") params.set("status", s.key);
          if (order) params.set("order", order);
          const href = params.toString() ? `/maintenance?${params}` : "/maintenance";
          return (
            <Link key={s.key} href={href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                active ? "bg-brand-blue text-white" : "bg-white border border-gray-200 text-brand-gray hover:border-gray-300"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-brand-gray/60">Ordenar por fecha:</span>
        <Link href={`/maintenance${filterStatus ? `?status=${filterStatus}&order=desc` : "?order=desc"}`}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            sortOrder === "desc" ? "bg-brand-blue text-white" : "bg-white border border-gray-200 text-brand-gray"
          }`}
        >
          Más reciente
        </Link>
        <Link href={`/maintenance${filterStatus ? `?status=${filterStatus}&order=asc` : "?order=asc"}`}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            sortOrder === "asc" ? "bg-brand-blue text-white" : "bg-white border border-gray-200 text-brand-gray"
          }`}
        >
          Más antiguo
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-base min-w-[640px]">
          <thead className="bg-brand-blue text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Título</th>
              <th className="text-left px-4 py-3 font-medium">Vehículo</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 font-medium">Prioridad</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Asignado a</th>
              <th className="text-left px-4 py-3 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-gray/60">
                  No hay órdenes de mantenimiento
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-brand-light/50">
                <td className="px-4 py-3 font-medium">
                  <a href={`/maintenance/${t.id}`} className="text-brand-blue hover:underline underline-offset-2">{t.title}</a>
                </td>
                <td className="px-4 py-3">{t.vehicle.plate}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue">
                    {typeLabel[t.ticketType] || t.ticketType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColor[t.priority]}`}>
                    {priorityLabel[t.priority] || t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor[t.status]}`}>
                    {statusLabel[t.status] || t.status}
                  </span>
                </td>
                <td className="px-4 py-3">{t.assignedTo?.name || "—"}</td>
                <td className="px-4 py-3 text-brand-gray/70">
                  {new Date(t.createdAt).toLocaleDateString("es-CL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
