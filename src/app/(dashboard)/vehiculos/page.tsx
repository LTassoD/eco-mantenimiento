import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const today = new Date();

  const vehicles = await prisma.vehicle.findMany({
    include: { driver: true, workCenter: true },
    orderBy: { createdAt: "desc" },
  });

  function docDaysLeft(exp: Date | null): number | null {
    if (!exp) return null;
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function docColor(days: number | null): string {
    if (days === null) return "text-gray-400";
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 14) return "text-yellow-600 font-semibold";
    return "text-green-600";
  }

  function docLabel(days: number | null): string {
    if (days === null) return "—";
    if (days < 0) return "Vencido";
    if (days <= 14) return `${days}d`;
    return "Vigente";
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Vehículos</h2>
        <a href="/vehiculos/nuevo" className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
          + Nuevo vehículo
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-base">
          <thead className="bg-brand-blue text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Patente</th>
              <th className="text-left px-4 py-3 font-medium">Marca / Modelo</th>
              <th className="text-left px-4 py-3 font-medium">Rev. Téc.</th>
              <th className="text-left px-4 py-3 font-medium">Perm. Circ.</th>
              <th className="text-left px-4 py-3 font-medium">Seguro</th>
              <th className="text-left px-4 py-3 font-medium">Conductor</th>
              <th className="text-left px-4 py-3 font-medium">Centro</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-brand-gray/60">
                  No hay vehículos registrados
                </td>
              </tr>
            )}
            {vehicles.map((v) => {
              const rtDays = docDaysLeft(v.revisionTecnicaExp);
              const pcDays = docDaysLeft(v.permisoCirculacionExp);
              const soDays = docDaysLeft(v.seguroObligatorioExp);
              return (
              <tr key={v.id} className="hover:bg-brand-light/50">
                <td className="px-4 py-3 font-medium">
                  <a href={`/vehiculos/${v.id}`} className="text-brand-blue hover:underline underline-offset-2">{v.plate}</a>
                </td>
                <td className="px-4 py-3">{v.brand} {v.model}</td>
                <td className={`px-4 py-3 ${docColor(rtDays)}`}>{docLabel(rtDays)}</td>
                <td className={`px-4 py-3 ${docColor(pcDays)}`}>{docLabel(pcDays)}</td>
                <td className={`px-4 py-3 ${docColor(soDays)}`}>{docLabel(soDays)}</td>
                <td className="px-4 py-3">{v.driver?.name || "—"}</td>
                <td className="px-4 py-3">{v.workCenter?.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {v.isActive ? "Operativo" : "No operativo"}
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
