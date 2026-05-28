import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();

  const checklist = await prisma.checklist.create({
    data: {
      vehicleId: body.vehicleId,
      driverId: dbUser.id,
      templateId: body.templateId,
      shift: body.shift,
      currentKm: parseInt(body.currentKm),
      notes: body.notes || null,
      digitalSignature: body.digitalSignature || null,
      signedAt: body.digitalSignature ? new Date() : null,
      responses: {
        create: body.responses.map((r: any) => ({
          itemId: r.itemId,
          value: r.value,
          photoUrl: r.photoUrl || null,
          notes: r.notes || null,
        })),
      },
    },
    include: { responses: true },
  });

  return NextResponse.json(checklist);
}
