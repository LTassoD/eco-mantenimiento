import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "../(auth)/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!dbUser) redirect("/login");

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    DRIVER: "Conductor",
    SUPERVISOR: "Supervisor",
    MECHANIC: "Mecánico",
    MANAGER: "Gerencia",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-blue text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading font-bold text-xl md:text-2xl">
            Eco<span className="text-brand-neon">Mantenimiento</span>
          </h1>
          <div className="flex items-center gap-4 text-base">
            <span className="opacity-80">{dbUser.name}</span>
            <span className="bg-white/20 px-3 py-1 rounded text-sm">
              {roleLabel[dbUser.role] || dbUser.role}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm opacity-70 hover:opacity-100 underline underline-offset-2"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-8 text-base">
          <DashboardLink href="/dashboard" label="Inicio" />
          {["ADMIN", "SUPERVISOR", "DRIVER"].includes(dbUser.role) && (
            <DashboardLink href="/checklist" label="Checklist" />
          )}
          {["ADMIN", "SUPERVISOR"].includes(dbUser.role) && (
            <DashboardLink href="/vehiculos" label="Vehículos" />
          )}
          {["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role) && (
            <DashboardLink href="/maintenance" label="Mantenimiento" />
          )}
          {["ADMIN", "MANAGER"].includes(dbUser.role) && (
            <DashboardLink href="/reports" label="Reportes" />
          )}
          {["ADMIN", "SUPERVISOR"].includes(dbUser.role) && (
            <DashboardLink href="/admin/users" label="Usuarios" />
          )}
        </div>
      </nav>

      <main className="flex-1 bg-brand-light">{children}</main>
    </div>
  );
}

function DashboardLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-brand-gray hover:text-brand-blue font-medium transition-colors"
    >
      {label}
    </a>
  );
}
