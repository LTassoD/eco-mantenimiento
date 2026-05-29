import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    include: { driver: true, workCenter: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    const revisionTecnicaExp = body.revisionTecnicaExp ? new Date(body.revisionTecnicaExp) : null;
    const permisoCirculacionExp = body.permisoCirculacionExp ? new Date(body.permisoCirculacionExp) : null;
    const seguroObligatorioExp = body.seguroObligatorioExp ? new Date(body.seguroObligatorioExp) : null;

    const isActive = !isExpired(revisionTecnicaExp) && !isExpired(permisoCirculacionExp) && !isExpired(seguroObligatorioExp);

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: body.plate,
        brand: body.brand,
        model: body.model,
        year: parseInt(body.year),
        vin: body.vin || null,
        currentKm: parseInt(body.currentKm) || 0,
        kmServiceInterval: parseInt(body.kmServiceInterval) || null,
        revisionTecnicaExp: revisionTecnicaExp || null,
        permisoCirculacionExp: permisoCirculacionExp || null,
        seguroObligatorioExp: seguroObligatorioExp || null,
        isActive,
        driverId: body.driverId || null,
        workCenterId: body.workCenterId || null,
      },
    });

    return NextResponse.json(vehicle);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

function isExpired(date: Date | null): boolean {
  if (!date) return false;
  return date < new Date();
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await request.json();

  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const revisionTecnicaExp = body.revisionTecnicaExp ? new Date(body.revisionTecnicaExp) : null;
    const permisoCirculacionExp = body.permisoCirculacionExp ? new Date(body.permisoCirculacionExp) : null;
    const seguroObligatorioExp = body.seguroObligatorioExp ? new Date(body.seguroObligatorioExp) : null;

    const isActive = (!revisionTecnicaExp || !isExpired(revisionTecnicaExp)) &&
      (!permisoCirculacionExp || !isExpired(permisoCirculacionExp)) &&
      (!seguroObligatorioExp || !isExpired(seguroObligatorioExp));

    const vehicle = await prisma.vehicle.update({
      where: { id: body.id },
      data: {
        plate: body.plate,
        brand: body.brand,
        model: body.model,
        year: parseInt(body.year),
        vin: body.vin || null,
        currentKm: parseInt(body.currentKm) || 0,
        kmServiceInterval: parseInt(body.kmServiceInterval) || null,
        revisionTecnicaExp,
        permisoCirculacionExp,
        seguroObligatorioExp,
        isActive,
        driverId: body.driverId || null,
        workCenterId: body.workCenterId || null,
      },
      include: { driver: true, workCenter: true },
    });

    return NextResponse.json(vehicle);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
