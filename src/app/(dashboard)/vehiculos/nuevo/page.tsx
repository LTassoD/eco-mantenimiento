"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewVehiclePage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/vehiculos/datos").then(r => r.json()).then(d => {
      setDrivers(d.drivers);
      setCenters(d.centers);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());

    const res = await fetch("/api/vehiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear vehículo");
      setPending(false);
      return;
    }

    router.push("/vehiculos");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-8">Nuevo vehículo</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Patente</label>
            <input name="plate" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue uppercase" placeholder="ABCD-12" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Año</label>
            <input name="year" type="number" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Marca</label>
            <input name="brand" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Modelo</label>
            <input name="model" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">VIN (opcional)</label>
            <input name="vin" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Kilometraje actual</label>
            <input name="currentKm" type="number" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Intervalo mantenimiento (km)</label>
          <input name="kmServiceInterval" type="number" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Ej: 5000" />
        </div>

        <h3 className="font-heading font-bold text-lg text-brand-blue pt-2">Vencimiento de documentos</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Revisión técnica</label>
            <input name="revisionTecnicaExp" type="date" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Permiso circulación</label>
            <input name="permisoCirculacionExp" type="date" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Seguro obligatorio</label>
            <input name="seguroObligatorioExp" type="date" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Conductor asignado</label>
          <select name="driverId" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
            <option value="">Sin conductor</option>
            {drivers.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
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
            {pending ? "Creando..." : "Crear vehículo"}
          </button>
          <a href="/vehiculos" className="border border-gray-300 text-brand-gray font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
