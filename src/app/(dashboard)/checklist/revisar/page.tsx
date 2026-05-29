import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ReviewListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const checklists = await prisma.checklist.findMany({
    where: { status: "PENDING" },
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-2">Revisar Checklists</h2>
      <p className="text-brand-gray/60 text-base mb-8">Pendientes de aprobación por supervisor</p>

      <div className="space-y-3">
        {checklists.length === 0 && (
          <p className="text-brand-gray/60 text-center py-10">No hay checklists pendientes</p>
        )}
        {checklists.map((c) => (
          <a key={c.id} href={`/checklist/revisar/${c.id}`}
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-lg">{c.vehicle.plate}</span>
                <span className="text-brand-gray/60 ml-3">{c.driver.name}</span>
                <span className="text-brand-gray/60 ml-3">· {new Date(c.createdAt).toLocaleDateString("es-CL")}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-brand-gray/60">{c.shift.replace("_", " ")}</span>
                <span className="text-sm text-brand-gray/60">{c.currentKm.toLocaleString()} km</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded">Pendiente</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
