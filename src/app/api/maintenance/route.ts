import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const vehicleId = searchParams.get("vehicleId");

  const where: any = {};
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const tickets = await prisma.maintenanceTicket.findMany({
    where,
    include: {
      vehicle: true,
      reportedBy: true,
      assignedTo: true,
      checklist: { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      checklistId: body.checklistId || null,
      vehicleId: body.vehicleId,
      reportedById: dbUser.id,
      assignedToId: body.assignedToId || null,
      title: body.title,
      description: body.description || null,
      priority: body.priority || "MEDIUM",
      ticketType: body.ticketType || "CORRECTIVE",
      currentKm: body.currentKm ? parseInt(body.currentKm) : null,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
    },
  });

  return NextResponse.json(ticket);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR", "MECHANIC"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 });
  }

  const validStatuses = ["OPEN", "IN_PROGRESS", "WAITING_PARTS", "RESOLVED", "CLOSED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  // Role-based transition rules
  if (status === "CLOSED" && !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "Solo supervisores pueden cerrar órdenes" }, { status: 403 });
  }

  if (status === "OPEN" && !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "Solo supervisores pueden reabrir órdenes" }, { status: 403 });
  }

  const data: any = { status };
  if (status === "RESOLVED") data.completedDate = new Date();

  const updated = await prisma.maintenanceTicket.update({
    where: { id },
    data,
    include: { vehicle: true, assignedTo: true, reportedBy: true },
  });

  return NextResponse.json(updated);
}
