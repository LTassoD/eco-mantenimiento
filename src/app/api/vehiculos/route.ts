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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();

  const vehicle = await prisma.vehicle.create({
    data: {
      plate: body.plate,
      brand: body.brand,
      model: body.model,
      year: parseInt(body.year),
      vin: body.vin || null,
      currentKm: parseInt(body.currentKm) || 0,
      kmServiceInterval: parseInt(body.kmServiceInterval) || null,
      driverId: body.driverId || null,
      workCenterId: body.workCenterId || null,
    },
  });

  return NextResponse.json(vehicle);
}
