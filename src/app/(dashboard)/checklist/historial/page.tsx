import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChecklistHistoryClient } from "./client";

export default async function ChecklistHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["DRIVER", "ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const where: any = {};
  if (dbUser.role === "DRIVER") {
    where.driverId = dbUser.id;
  }
  if (q) {
    where.vehicle = { plate: { contains: q } };
  }

  const checklists = await prisma.checklist.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <ChecklistHistoryClient
      checklists={JSON.parse(JSON.stringify(checklists))}
      role={dbUser.role}
      query={q || ""}
    />
  );
}
