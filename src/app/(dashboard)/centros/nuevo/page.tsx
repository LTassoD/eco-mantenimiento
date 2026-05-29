"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCenterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/centros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear centro");
      setPending(false);
      return;
    }

    router.push("/centros");
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-8">Nuevo centro de trabajo</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Nombre del centro</label>
          <input name="name" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Ej: Papeles Cordillera" />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {pending ? "Creando..." : "Crear centro"}
          </button>
          <a href="/centros" className="border border-gray-300 text-brand-gray font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
