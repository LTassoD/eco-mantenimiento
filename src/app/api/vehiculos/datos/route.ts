import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [drivers, centers] = await Promise.all([
    prisma.user.findMany({ where: { role: "DRIVER", isActive: true }, orderBy: { name: "asc" } }),
    prisma.workCenter.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ drivers, centers });
}
