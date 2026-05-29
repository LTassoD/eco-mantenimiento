"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado",
};
const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function ChecklistHistoryClient({
  checklists,
  role,
  query,
}: {
  checklists: any[];
  role: string;
  query: string;
}) {
  const [search, setSearch] = useState(query);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    router.push(`/checklist/historial${params.toString() ? `?${params}` : ""}`);
    router.refresh();
  }

  const lastChecklist = checklists.length > 0 ? checklists[0] : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Historial de Checklists</h2>
        <a
          href={`/checklist${lastChecklist ? `?vehicleId=${lastChecklist.vehicleId}&shift=${lastChecklist.shift}&currentKm=${lastChecklist.currentKm}` : "/checklist"}`}
          className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition"
        >
          + Nuevo checklist
        </a>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por patente..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button type="submit" className="bg-brand-blue text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition">
            Buscar
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); router.push("/checklist/historial"); router.refresh(); }}
              className="border border-gray-300 text-brand-gray font-medium px-4 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {checklists.length === 0 ? (
        <div className="text-center py-16 text-brand-gray/60">
          <p className="text-lg">No hay checklists {search ? "que coincidan con la búsqueda" : "registrados"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-lg">{c.vehicle.plate}</span>
                  <span className="text-brand-gray/60 ml-3">{c.vehicle.brand} {c.vehicle.model}</span>
                  <span className="text-brand-gray/60 ml-3">{c.driver?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-brand-gray/60">{c.shift.replace("_", " ")}</span>
                  <span className="text-sm text-brand-gray/60">{c.currentKm.toLocaleString()} km</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor[c.status as string] || ""}`}>
                    {statusLabel[c.status as string] || c.status}
                  </span>
                  <span className="text-xs text-brand-gray/40">{new Date(c.createdAt).toLocaleDateString("es-CL")}</span>
                  <a href={`/api/checklist/pdf?id=${c.id}`} target="_blank"
                    className="text-brand-blue hover:underline text-sm font-medium"
                  >
                    PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
