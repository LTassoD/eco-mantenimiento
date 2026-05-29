"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Vehicle = {
  id: string; plate: string; brand: string; model: string; year: number;
  vin: string | null; currentKm: number; nextServiceKm: number | null;
  kmServiceInterval: number | null; isActive: boolean;
  revisionTecnicaExp: string | null;
  permisoCirculacionExp: string | null;
  seguroObligatorioExp: string | null;
  driver: { id: string; name: string } | null;
  workCenter: { id: string; name: string } | null;
};

function docStatus(exp: string | null): { label: string; color: string } {
  if (!exp) return { label: "Sin registrar", color: "text-gray-400" };
  const expDate = new Date(exp);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Vencido (${Math.abs(diffDays)} días)`, color: "text-red-600" };
  if (diffDays <= 14) return { label: `Vence en ${diffDays}d`, color: "text-yellow-600" };
  return { label: `Vence: ${expDate.toLocaleDateString("es-CL")}`, color: "text-green-600" };
}

function docBgColor(exp: string | null): string {
  if (!exp) return "bg-white";
  const diffDays = Math.ceil((new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "bg-red-50 border-red-200";
  if (diffDays <= 14) return "bg-yellow-50 border-yellow-200";
  return "bg-green-50 border-green-200";
}

const typeLabel: Record<string, string> = {
  PREVENTIVE: "Preventivo", CORRECTIVE: "Correctivo", INSPECTION: "Inspección",
};
const statusLabel: Record<string, string> = {
  OPEN: "Abierto", IN_PROGRESS: "En progreso",
  WAITING_PARTS: "Esperando repuestos", RESOLVED: "Resuelto", CLOSED: "Cerrado",
};
const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_PARTS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700", CLOSED: "bg-gray-100 text-gray-500",
};

export function VehicleDetailClient({
  vehicle: initial,
  drivers,
  centers,
  checklists,
  tickets,
}: {
  vehicle: Vehicle;
  drivers: any[];
  centers: any[];
  checklists: any[];
  tickets: any[];
}) {
  const [vehicle, setVehicle] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());

    const res = await fetch(`/api/vehiculos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vehicle.id, ...body }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al actualizar");
      setPending(false);
      return;
    }

    const updated = await res.json();
    setVehicle(updated);
    setEditing(false);
    setPending(false);
    router.refresh();
  }

  const nextServiceKm = vehicle.nextServiceKm ?? (
    vehicle.kmServiceInterval ? vehicle.currentKm + vehicle.kmServiceInterval : null
  );
  const kmUntilService = nextServiceKm ? nextServiceKm - vehicle.currentKm : null;
  const serviceDue = kmUntilService !== null && kmUntilService <= 0;

  async function handleDelete() {
    if (!confirm("¿Eliminar este vehículo? Se eliminarán todos sus checklists y órdenes de mantenimiento asociadas.")) return;
    setDeleting(true);
    const res = await fetch("/api/vehiculos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vehicle.id }),
    });
    if (!res.ok) {
      alert("Error al eliminar vehículo");
      setDeleting(false);
      return;
    }
    router.push("/vehiculos");
    router.refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">
          {vehicle.plate}
        </h2>
        <div className="flex gap-3">
          <button onClick={() => setEditing(!editing)}
            className="bg-brand-blue text-white font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
          {!editing && (
            <button onClick={handleDelete} disabled={deleting}
              className="border border-red-300 text-red-600 font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          )}
        </div>
      </div>

      {serviceDue && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl mb-6 font-medium">
          Mantenimiento preventivo vencido ({Math.abs(kmUntilService!)} km excedidos)
        </div>
      )}
      {kmUntilService !== null && kmUntilService > 0 && kmUntilService <= 500 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-5 py-3 rounded-xl mb-6 font-medium">
          Próximo mantenimiento en {kmUntilService} km
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Patente</label>
              <input name="plate" defaultValue={vehicle.plate} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Año</label>
              <input name="year" type="number" defaultValue={vehicle.year} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Marca</label>
              <input name="brand" defaultValue={vehicle.brand} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Modelo</label>
              <input name="model" defaultValue={vehicle.model} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">VIN</label>
              <input name="vin" defaultValue={vehicle.vin || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">KM actual</label>
              <input name="currentKm" type="number" defaultValue={vehicle.currentKm} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Intervalo mantenimiento (km)</label>
            <input name="kmServiceInterval" type="number" defaultValue={vehicle.kmServiceInterval || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>

          <h3 className="font-heading font-bold text-base text-brand-blue pt-1">Vencimiento de documentos</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Revisión técnica</label>
              <input name="revisionTecnicaExp" type="date" defaultValue={vehicle.revisionTecnicaExp?.split("T")[0] || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Permiso circulación</label>
              <input name="permisoCirculacionExp" type="date" defaultValue={vehicle.permisoCirculacionExp?.split("T")[0] || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Seguro obligatorio</label>
              <input name="seguroObligatorioExp" type="date" defaultValue={vehicle.seguroObligatorioExp?.split("T")[0] || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Conductor</label>
              <select name="driverId" defaultValue={vehicle.driver?.id || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
                <option value="">Sin conductor</option>
                {drivers.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Centro</label>
              <select name="workCenterId" defaultValue={vehicle.workCenter?.id || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
                <option value="">Sin centro</option>
                {centers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-brand-gray/60">El estado operativo se calcula automáticamente según los documentos vigentes.</p>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
              {pending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Marca / Modelo</p>
              <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Año / VIN</p>
              <p className="font-medium">{vehicle.year} {vehicle.vin ? `· ${vehicle.vin}` : ""}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Kilometraje</p>
              <p className="font-medium">{vehicle.currentKm.toLocaleString()} km</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Conductor</p>
              <p className="font-medium">{vehicle.driver?.name || "—"}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Centro de trabajo</p>
              <p className="font-medium">{vehicle.workCenter?.name || "—"}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-brand-gray/60 mb-1">Estado</p>
              <p className={`font-medium ${vehicle.isActive ? "text-green-600" : "text-red-600"}`}>
                {vehicle.isActive ? "Operativo" : "No operativo"}
              </p>
            </div>
            {kmUntilService !== null && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-brand-gray/60 mb-1">Próximo mantenimiento</p>
                <p className={`font-medium ${serviceDue ? "text-red-600" : "text-brand-gray"}`}>
                  {serviceDue ? "VENCIDO" : `${kmUntilService.toLocaleString()} km`}
                </p>
              </div>
            )}
          </div>

          <h3 className="font-heading font-bold text-lg text-brand-blue mb-3">Documentos</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Revisión técnica", date: vehicle.revisionTecnicaExp },
              { label: "Permiso circulación", date: vehicle.permisoCirculacionExp },
              { label: "Seguro obligatorio", date: vehicle.seguroObligatorioExp },
            ].map((doc) => {
              const status = docStatus(doc.date);
              const bg = docBgColor(doc.date);
              return (
                <div key={doc.label} className={`rounded-2xl border p-5 ${bg}`}>
                  <p className="text-sm text-brand-gray/60 mb-1">{doc.label}</p>
                  <p className={`font-semibold ${status.color}`}>{status.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mt-8">
        <div>
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">Checklists recientes</h3>
          {checklists.length === 0 ? (
            <p className="text-brand-gray/60">Sin checklists</p>
          ) : (
            <div className="space-y-2">
              {checklists.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{new Date(c.createdAt).toLocaleDateString("es-CL")}</p>
                    <p className="text-xs text-brand-gray/60">KM: {c.currentKm.toLocaleString()} · {c.shift}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    c.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    c.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {c.status === "APPROVED" ? "Aprobado" : c.status === "REJECTED" ? "Rechazado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">
            Órdenes de mantenimiento
            <a href={`/maintenance/nuevo?vehicleId=${vehicle.id}`} className="text-sm font-normal ml-3 text-brand-blue underline underline-offset-2">
              + Nueva
            </a>
          </h3>
          {tickets.length === 0 ? (
            <p className="text-brand-gray/60">Sin órdenes</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{t.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor[t.status] || ""}`}>
                      {statusLabel[t.status] || t.status}
                    </span>
                  </div>
                  <p className="text-xs text-brand-gray/60">
                    {typeLabel[t.ticketType] || t.ticketType} · {new Date(t.createdAt).toLocaleDateString("es-CL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
