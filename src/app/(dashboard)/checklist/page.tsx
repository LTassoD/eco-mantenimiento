import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ChecklistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "DRIVER", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="font-heading font-bold text-2xl text-brand-blue mb-6">
        Checklist Diario
      </h2>
      <p className="text-brand-gray/60">Próximamente: formulario de checklist con cámara.</p>
    </div>
  );
}
