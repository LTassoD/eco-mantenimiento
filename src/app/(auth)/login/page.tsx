"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Credenciales inválidas");
      setPending(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuario no encontrado");
      setPending(false);
      return;
    }

    const res = await fetch("/api/login?email=" + encodeURIComponent(email));
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("Usuario no autorizado");
      setPending(false);
      return;
    }

    const { role } = await res.json();
    await supabase.auth.updateUser({ data: { role } });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10">
        <div className="text-center mb-10">
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-blue">
            Eco<span className="text-brand-green">Mantenimiento</span>
          </h1>
          <p className="text-brand-gray/60 text-base mt-2">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-medium text-brand-gray mb-2">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-5 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="tu@correo.cl"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-brand-gray mb-2">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-5 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand-blue text-white font-heading font-bold text-lg py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
