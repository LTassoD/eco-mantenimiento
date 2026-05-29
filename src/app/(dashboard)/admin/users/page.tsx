import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { workCenter: true },
    orderBy: { createdAt: "desc" },
  });

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador", DRIVER: "Conductor",
    SUPERVISOR: "Supervisor", MECHANIC: "Mecánico", MANAGER: "Gerencia",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Usuarios</h2>
        <a
          href="/admin/users/nuevo"
          className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition"
        >
          + Nuevo usuario
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-base min-w-[640px]">
          <thead className="bg-brand-blue text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Rol</th>
              <th className="text-left px-4 py-3 font-medium">Centro</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Creado</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-gray/60">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-brand-light/50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-brand-gray/70">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-brand-blue/10 text-brand-blue text-xs font-medium px-2 py-0.5 rounded">
                    {roleLabel[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-gray/70">{u.workCenter?.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-gray/70">
                  {new Date(u.createdAt).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <a href={`/admin/users/${u.id}`} className="text-brand-blue hover:underline text-sm font-medium">Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
