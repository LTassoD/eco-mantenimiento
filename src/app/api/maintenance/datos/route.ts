import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [mechanics, vehicles] = await Promise.all([
    prisma.user.findMany({ where: { role: "MECHANIC", isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { plate: "asc" } }),
  ]);
  return NextResponse.json({ mechanics, vehicles });
}
