"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/vehiculos/datos").then(r => r.json()).then(d => setCenters(d.centers));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      role: form.get("role"),
      workCenterId: form.get("workCenterId") || null,
    };

    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear usuario");
      setPending(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-8">Nuevo usuario</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Nombre</label>
          <input name="name" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Contraseña</label>
          <input name="password" type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Rol</label>
          <select name="role" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
            <option value="DRIVER">Conductor</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="MECHANIC">Mecánico</option>
            <option value="MANAGER">Gerencia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Centro de trabajo</label>
          <select name="workCenterId" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
            <option value="">Sin centro</option>
            {centers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {pending ? "Creando..." : "Crear usuario"}
          </button>
          <a href="/admin/users" className="border border-gray-300 text-brand-gray font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
