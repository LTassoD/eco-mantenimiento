import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, email, password, role, workCenterId } = await request.json();

  const { data: authUser, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await prisma.user.create({
    data: {
      id: authUser.user.id, name, email, role,
      workCenterId: workCenterId || null,
    },
  });

  return NextResponse.json({ success: true });
}
