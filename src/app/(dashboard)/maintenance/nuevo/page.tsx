"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewMaintenancePage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicle = searchParams.get("vehicleId");
  const preselectedChecklist = searchParams.get("checklistId");

  useEffect(() => {
    fetch("/api/maintenance/datos").then(r => r.json()).then(d => {
      setMechanics(d.mechanics);
      setVehicles(d.vehicles);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body: Record<string, any> = Object.fromEntries(form.entries());
    if (preselectedChecklist) body.checklistId = preselectedChecklist;

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear orden");
      setPending(false);
      return;
    }

    router.push("/maintenance");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-8">Nueva orden de mantenimiento</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <input type="hidden" name="checklistId" value={preselectedChecklist || ""} />

        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Título</label>
          <input name="title" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Ej: Freno delantero izquierdo" />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Descripción</label>
          <textarea name="description" rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Detalle del problema..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Vehículo</label>
            <select name="vehicleId" required defaultValue={preselectedVehicle || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              <option value="">Seleccionar vehículo</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Tipo</label>
            <select name="ticketType" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              <option value="CORRECTIVE">Correctivo</option>
              <option value="PREVENTIVE">Preventivo</option>
              <option value="INSPECTION">Inspección</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Prioridad</label>
            <select name="priority" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              <option value="LOW">Baja</option>
              <option value="MEDIUM" selected>Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Asignar a mecánico</label>
            <select name="assignedToId" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              <option value="">Sin asignar</option>
              {mechanics.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">KM actual</label>
            <input name="currentKm" type="number" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Opcional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Fecha programada</label>
            <input name="scheduledDate" type="date" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {pending ? "Creando..." : "Crear orden"}
          </button>
          <a href="/maintenance" className="border border-gray-300 text-brand-gray font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
