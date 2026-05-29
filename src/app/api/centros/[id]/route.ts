import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const center = await prisma.workCenter.findUnique({
    where: { id },
    include: {
      users: { orderBy: { name: "asc" } },
      vehicles: { include: { driver: true }, orderBy: { plate: "asc" } },
    },
  });
  if (!center) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(center);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "Ya existe un centro con ese nombre" }, { status: 409 });
  }

  const center = await prisma.workCenter.update({
    where: { id },
    data: { name: body.name.trim() },
  });
  return NextResponse.json(center);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const count = await prisma.workCenter.findUnique({ where: { id }, include: { _count: { select: { users: true, vehicles: true } } } });
  if (count && (count._count.users > 0 || count._count.vehicles > 0)) {
    return NextResponse.json({ error: "No se puede eliminar: el centro tiene usuarios o vehículos asignados" }, { status: 409 });
  }

  await prisma.workCenter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
