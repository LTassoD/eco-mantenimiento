import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const centers = await prisma.workCenter.findMany({
    include: {
      _count: { select: { users: true, vehicles: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(centers);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const existing = await prisma.workCenter.findUnique({ where: { name: body.name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un centro con ese nombre" }, { status: 409 });
  }

  const center = await prisma.workCenter.create({ data: { name: body.name.trim() } });
  return NextResponse.json(center);
}
