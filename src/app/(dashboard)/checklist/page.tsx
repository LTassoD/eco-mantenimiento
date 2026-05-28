"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ChecklistPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  // Form fields
  const [vehicleId, setVehicleId] = useState("");
  const [shift, setShift] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/checklist").then(r => r.json()).then(d => {
      setData(d);
      if (d.vehicles?.length === 1) setVehicleId(d.vehicles[0].id);
      setLoading(false);
    });
  }, []);

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL("image/png"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !shift || !currentKm) return alert("Completa todos los campos requeridos");
    if (!signature) return alert("Debes firmar digitalmente");

    setSubmitting(true);

    const res = await fetch("/api/checklist/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        templateId: data.template.id,
        shift,
        currentKm,
        notes,
        digitalSignature: signature,
        responses: Object.entries(responses).map(([itemId, value]) => ({ itemId, value })),
      }),
    });

    if (!res.ok) {
      alert("Error al enviar checklist");
      setSubmitting(false);
      return;
    }

    const checklist = await res.json();
    window.open(`/api/checklist/pdf?id=${checklist.id}`, "_blank");
    router.refresh();
    setSubmitting(false);
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!data?.template || !data?.vehicles?.length) return <div className="p-10 text-center text-brand-gray/60">No hay vehículos asignados o plantilla disponible</div>;

  const groupedItems = data.template.items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h2 className="font-heading font-bold text-3xl text-brand-blue mb-2">Checklist Diario</h2>
      <p className="text-brand-gray/60 text-base mb-8">Completa la inspección del vehículo antes de operar</p>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Vehículo</label>
              <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base bg-white outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="">Seleccionar</option>
                {data.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Turno</label>
              <select value={shift} onChange={e => setShift(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base bg-white outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="">Seleccionar</option>
                <option value="A">Turno A</option>
                <option value="B">Turno B</option>
                <option value="SMART_MORNING">Smart Mañana</option>
                <option value="SMART_AFTERNOON">Smart Tarde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1.5">Kilometraje actual</label>
              <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="0" />
            </div>
          </div>
        </div>

        {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
          <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">{category}</h3>
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-base">{item.name}</span>
                  <div className="flex gap-2">
                    {["yes", "no", "na"].map((val) => (
                      <button key={val} type="button" onClick={() => setResponses(prev => ({ ...prev, [item.id]: val }))}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition border ${responses[item.id] === val
                          ? val === "yes" ? "bg-green-500 text-white border-green-500"
                            : val === "no" ? "bg-red-500 text-white border-red-500"
                            : "bg-gray-400 text-white border-gray-400"
                          : "bg-white text-brand-gray border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {val === "yes" ? "Bien" : val === "no" ? "Mal" : "N/A"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">Observaciones</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Comentarios adicionales..." />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">Firma digital</h3>
          <p className="text-brand-gray/60 text-sm mb-4">Firma con el dedo en el recuadro</p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden mb-3" style={{ width: 320, height: 120 }}>
            <canvas
              ref={canvasRef}
              width={320}
              height={120}
              className="bg-white cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={saveSignature} className="bg-brand-blue text-white font-medium px-5 py-2 rounded-xl text-sm hover:opacity-90 transition">
              Guardar firma
            </button>
            <button type="button" onClick={clearSignature} className="border border-gray-300 text-brand-gray font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
              Limpiar
            </button>
          </div>
          {signature && <p className="text-green-600 text-sm mt-2">✓ Firma guardada</p>}
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-brand-blue text-white font-heading font-bold text-lg py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          {submitting ? "Enviando..." : "Enviar checklist"}
        </button>
      </form>
    </div>
  );
}
