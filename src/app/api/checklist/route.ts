import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const template = await prisma.checklistTemplate.findFirst({
    where: { isActive: true },
    include: { items: { orderBy: { order: "asc" } } },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      OR: dbUser.role === "DRIVER" ? [{ driverId: dbUser.id }] : undefined,
    },
    include: { workCenter: true },
  });

  return NextResponse.json({ template, vehicles, user: dbUser });
}
