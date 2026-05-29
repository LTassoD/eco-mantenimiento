"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type ResponseItem = {
  id: string;
  value: string;
  photoUrl: string | null;
  notes: string | null;
  item: { category: string; name: string };
};

type Checklist = {
  id: string;
  shift: string;
  currentKm: number;
  notes: string | null;
  digitalSignature: string | null;
  signedAt: string | null;
  createdAt: string;
  driver: { name: string; email: string };
  vehicle: { plate: string; brand: string; model: string };
  responses: ResponseItem[];
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/checklist/pending`).then(r => r.json()).then((list: Checklist[]) => {
      const found = list.find(c => c.id === params.id);
      setChecklist(found || null);
      setLoading(false);
    });
  }, [params.id]);

  async function handleReview(status: "APPROVED" | "REJECTED") {
    setAction(status);
    setPending(true);
    const res = await fetch("/api/checklist/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistId: params.id, status }),
    });
    if (res.ok) {
      router.push("/checklist/revisar");
      router.refresh();
    } else {
      alert("Error al revisar checklist");
      setPending(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!checklist) return <div className="p-10 text-center text-brand-gray/60">Checklist no encontrado</div>;

  const grouped = checklist.responses.reduce((acc: Record<string, ResponseItem[]>, r) => {
    if (!acc[r.item.category]) acc[r.item.category] = [];
    acc[r.item.category].push(r);
    return acc;
  }, {});

  const hasIssues = checklist.responses.some(r => r.value === "no");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-3xl text-brand-blue">Revisar Checklist</h2>
          <p className="text-brand-gray/60 text-base mt-1">
            {checklist.vehicle.plate} — {checklist.driver.name} — {new Date(checklist.createdAt).toLocaleDateString("es-CL")}
          </p>
        </div>
        <a href="/checklist/revisar" className="border border-gray-300 text-brand-gray font-medium px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
          Volver
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Turno</p>
          <p className="font-medium">{checklist.shift.replace("_", " ")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Kilometraje</p>
          <p className="font-medium">{checklist.currentKm.toLocaleString()} km</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-brand-gray/60">Vehículo</p>
          <p className="font-medium">{checklist.vehicle.brand} {checklist.vehicle.model}</p>
        </div>
      </div>

      {hasIssues && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-5 py-3 rounded-xl mb-6 font-medium">
          Este checklist tiene elementos marcados como "Bajo Estandar" — considera crear una orden de mantenimiento.
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h3 className="font-heading font-bold text-lg text-brand-blue mb-3">{category}</h3>
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span>{r.item.name}</span>
                <div className="flex items-center gap-2">
                  {r.photoUrl && (
                    <img src={r.photoUrl} alt="Evidencia" className="w-10 h-10 rounded object-cover border cursor-pointer"
                      onClick={() => window.open(r.photoUrl!, "_blank")}
                    />
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    r.value === "yes" ? "bg-green-100 text-green-700" :
                    r.value === "no" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {r.value === "yes" ? "Estandar" : r.value === "no" ? "Bajo Estandar" : "No Aplica"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {checklist.notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-heading font-bold text-lg text-brand-blue mb-2">Observaciones</h3>
          <p className="text-brand-gray">{checklist.notes}</p>
        </div>
      )}

      {checklist.digitalSignature && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="font-heading font-bold text-lg text-brand-blue mb-3">Firma digital</h3>
          <img src={checklist.digitalSignature} alt="Firma" className="border rounded-lg" style={{ maxHeight: 100 }} />
          {checklist.signedAt && (
            <p className="text-xs text-brand-gray/60 mt-2">Firmado: {new Date(checklist.signedAt).toLocaleString("es-CL")}</p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => handleReview("APPROVED")} disabled={pending}
          className="bg-green-600 text-white font-heading font-bold px-8 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {pending && action === "APPROVED" ? "Aprobando..." : "Aprobar"}
        </button>
        <button onClick={() => handleReview("REJECTED")} disabled={pending}
          className="bg-red-600 text-white font-heading font-bold px-8 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {pending && action === "REJECTED" ? "Rechazando..." : "Rechazar"}
        </button>
        {hasIssues && (
          <button onClick={() => router.push(`/maintenance/nuevo?checklistId=${checklist.id}`)}
            className="border border-brand-blue text-brand-blue font-medium px-6 py-3 rounded-xl hover:bg-brand-blue/5 transition"
          >
            Crear orden de mantenimiento
          </button>
        )}
      </div>
    </div>
  );
}
