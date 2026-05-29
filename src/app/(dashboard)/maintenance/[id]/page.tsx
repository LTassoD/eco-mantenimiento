"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const statusLabel: Record<string, string> = {
  OPEN: "Abierto", IN_PROGRESS: "En progreso",
  WAITING_PARTS: "Esperando repuestos", RESOLVED: "Resuelto", CLOSED: "Cerrado",
};
const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_PARTS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700", CLOSED: "bg-gray-100 text-gray-500",
};
const priorityLabel: Record<string, string> = {
  LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica",
};
const typeLabel: Record<string, string> = {
  PREVENTIVE: "Preventivo", CORRECTIVE: "Correctivo", INSPECTION: "Inspección",
};

const transitions: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_PARTS", "RESOLVED"],
  WAITING_PARTS: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: ["OPEN"],
};

const transitionLabel: Record<string, string> = {
  IN_PROGRESS: "Iniciar trabajo",
  WAITING_PARTS: "Esperar repuestos",
  RESOLVED: "Marcar como finalizado",
  CLOSED: "Dar visto bueno final",
  OPEN: "Reabrir",
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/maintenance`).then(r => r.json()).then((list: any[]) => {
      const found = list.find((t: any) => t.id === params.id);
      setTicket(found || null);
      setLoading(false);
    });
    fetch("/api/login").then(r => r.json()).then(d => setUserRole(d.role));
  }, [params.id]);

  async function changeStatus(newStatus: string) {
    setPending(true);
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Error al actualizar");
      setPending(false);
      return;
    }
    const updated = await res.json();
    setTicket(updated);
    setPending(false);
    router.refresh();
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!ticket) return <div className="p-10 text-center text-brand-gray/60">Orden no encontrada</div>;

  const allowedTransitions = transitions[ticket.status] || [];
  const canChange = allowedTransitions.filter((s) => {
    if (s === "CLOSED") return ["ADMIN", "SUPERVISOR"].includes(userRole);
    if (s === "OPEN") return ["ADMIN", "SUPERVISOR"].includes(userRole);
    return ["ADMIN", "SUPERVISOR", "MECHANIC"].includes(userRole);
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-3xl text-brand-blue">{ticket.title}</h2>
          <p className="text-brand-gray/60 text-base mt-1">
            {ticket.vehicle.plate} — {new Date(ticket.createdAt).toLocaleDateString("es-CL")}
          </p>
        </div>
        <a href="/maintenance" className="border border-gray-300 text-brand-gray font-medium px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
          Volver
        </a>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Estado</p>
          <p className={`mt-1 text-xs font-medium px-2 py-0.5 rounded inline-block ${statusColor[ticket.status]}`}>
            {statusLabel[ticket.status] || ticket.status}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Prioridad</p>
          <p className="font-medium">{priorityLabel[ticket.priority] || ticket.priority}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Tipo</p>
          <p className="font-medium">{typeLabel[ticket.ticketType] || ticket.ticketType}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Vehículo</p>
          <p className="font-medium">{ticket.vehicle.plate}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Reportado por</p>
          <p className="font-medium">{ticket.reportedBy?.name || "—"}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Asignado a</p>
          <p className="font-medium">{ticket.assignedTo?.name || "—"}</p>
        </div>
        {ticket.currentKm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-brand-gray/60">KM</p>
            <p className="font-medium">{ticket.currentKm.toLocaleString()} km</p>
          </div>
        )}
        {ticket.scheduledDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-brand-gray/60">Programado</p>
            <p className="font-medium">{new Date(ticket.scheduledDate).toLocaleDateString("es-CL")}</p>
          </div>
        )}
        {ticket.completedDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-brand-gray/60">Finalizado</p>
            <p className="font-medium">{new Date(ticket.completedDate).toLocaleDateString("es-CL")}</p>
          </div>
        )}
      </div>

      {ticket.description && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="font-heading font-bold text-lg text-brand-blue mb-2">Descripción</h3>
          <p className="text-brand-gray whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}

      {canChange.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading font-bold text-lg text-brand-blue mb-4">Cambiar estado</h3>
          <div className="flex flex-wrap gap-3">
            {canChange.map((s) => (
              <button key={s} onClick={() => changeStatus(s)} disabled={pending}
                className={`font-heading font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-50 ${
                  s === "CLOSED" ? "bg-green-600 text-white hover:opacity-90" :
                  s === "RESOLVED" ? "bg-blue-600 text-white hover:opacity-90" :
                  s === "OPEN" ? "bg-gray-500 text-white hover:opacity-90" :
                  "bg-brand-blue text-white hover:opacity-90"
                }`}
              >
                {pending ? "Actualizando..." : transitionLabel[s] || s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
