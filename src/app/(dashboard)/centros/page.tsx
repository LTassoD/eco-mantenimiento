import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CentersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const centers = await prisma.workCenter.findMany({
    include: { _count: { select: { users: true, vehicles: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Centros de Trabajo</h2>
        <a href="/centros/nuevo" className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
          + Nuevo centro
        </a>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers.length === 0 && (
          <p className="text-brand-gray/60 col-span-full text-center py-10">No hay centros registrados</p>
        )}
        {centers.map((c) => (
          <a key={c.id} href={`/centros/${c.id}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
          >
            <h3 className="font-heading font-bold text-xl text-brand-blue mb-3">{c.name}</h3>
            <div className="flex gap-4 text-sm text-brand-gray/70">
              <span>{c._count.users} usuario{c._count.users !== 1 ? "s" : ""}</span>
              <span>{c._count.vehicles} vehículo{c._count.vehicles !== 1 ? "s" : ""}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
