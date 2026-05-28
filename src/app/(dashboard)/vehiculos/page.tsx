import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const vehicles = await prisma.vehicle.findMany({
    include: { driver: true, workCenter: true },
    orderBy: { createdAt: "desc" },
  });

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
              <th className="text-left px-4 py-3 font-medium">Año</th>
              <th className="text-left px-4 py-3 font-medium">KM</th>
              <th className="text-left px-4 py-3 font-medium">Conductor</th>
              <th className="text-left px-4 py-3 font-medium">Centro</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-gray/60">
                  No hay vehículos registrados
                </td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-brand-light/50">
                <td className="px-4 py-3 font-medium">{v.plate}</td>
                <td className="px-4 py-3">{v.brand} {v.model}</td>
                <td className="px-4 py-3 text-brand-gray/70">{v.year}</td>
                <td className="px-4 py-3 text-brand-gray/70">{v.currentKm.toLocaleString()} km</td>
                <td className="px-4 py-3">{v.driver?.name || "—"}</td>
                <td className="px-4 py-3">{v.workCenter?.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {v.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
