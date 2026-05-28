"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type LoginState = { error?: string } | undefined;

export async function login(state: LoginState, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Credenciales inválidas" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuario no encontrado" };

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser || !dbUser.isActive) {
    await supabase.auth.signOut();
    return { error: "Usuario no autorizado" };
  }

  await supabase.auth.updateUser({ data: { role: dbUser.role } });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
