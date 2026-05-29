import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const checklists = await prisma.checklist.findMany({
    where: { status: "PENDING" },
    include: {
      vehicle: true,
      driver: true,
      template: true,
      responses: { include: { item: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checklists);
}
