import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ role: user.role });
  }

  // Return current session user if no email param
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { email: authUser.email } });
  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({ role: dbUser.role, name: dbUser.name, email: dbUser.email });
}
