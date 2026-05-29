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

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, name, email, password, role, workCenterId, isActive } = await request.json();

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (password) {
    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (email && email !== existing.email) {
    const { error } = await supabase.auth.admin.updateUserById(id, { email });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.auth.admin.updateUserById(id, { user_metadata: { name, role } });

  await prisma.user.update({
    where: { id },
    data: { name, email, role, workCenterId: workCenterId || null, isActive },
  });

  return NextResponse.json({ success: true });
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

  await prisma.user.delete({ where: { id } });

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) console.error("Error deleting auth user:", error.message);

  return NextResponse.json({ success: true });
}
