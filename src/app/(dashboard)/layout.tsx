import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "../(auth)/login/actions";
import { MobileNav, DesktopNav } from "./nav.client";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="font-heading font-bold text-lg sm:text-2xl">
            <span className="hidden sm:inline">Eco</span><span className="text-brand-neon">Mantenimiento</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <MobileNav role={dbUser.role} userName={dbUser.name} roleLabel={roleLabel[dbUser.role] || dbUser.role} />
            <form action={logout} className="hidden sm:block">
              <button
                type="submit"
                className="text-sm opacity-70 hover:opacity-100 underline underline-offset-2 whitespace-nowrap"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-80 truncate">
            <span className="truncate max-w-[160px]">{dbUser.name}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs shrink-0">
              {roleLabel[dbUser.role] || dbUser.role}
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs opacity-70 hover:opacity-100 underline underline-offset-2"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-6 py-3 overflow-x-auto">
          <DesktopNav role={dbUser.role} />
        </div>
      </nav>

      <main className="flex-1 bg-brand-light">{children}</main>
    </div>
  );
}
