"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChecklistPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();
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
      const prefillVehicle = searchParams.get("vehicleId");
      const prefillShift = searchParams.get("shift");
      const prefillKm = searchParams.get("currentKm");
      if (prefillVehicle && d.vehicles?.some((v: any) => v.id === prefillVehicle)) setVehicleId(prefillVehicle);
      else if (d.vehicles?.length === 1) setVehicleId(d.vehicles[0].id);
      if (prefillShift) setShift(prefillShift);
      if (prefillKm) setCurrentKm(prefillKm);
      if (d.template?.items) {
        const defaults: Record<string, string> = {};
        d.template.items.forEach((item: any) => { defaults[item.id] = "yes"; });
        setResponses(defaults);
        setItemsLoaded(true);
      }
      setLoading(false);
    });
  }, [searchParams]);

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
  }

  function takePhoto(itemId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => ({ ...prev, [itemId]: reader.result as string }));
      reader.readAsDataURL(file);
    };
    input.click();
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
        responses: Object.entries(responses).map(([itemId, value]) => ({ itemId, value, photoUrl: photos[itemId] || null })),
      }),
    });

    if (!res.ok) {
      alert("Error al enviar checklist");
      setSubmitting(false);
      return;
    }

    const checklist = await res.json();
    window.open(`/api/checklist/pdf?id=${checklist.id}`, "_blank");
    router.push("/checklist/historial");
    router.refresh();
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!data?.template || !data?.vehicles?.length) return <div className="p-10 text-center text-brand-gray/60">No hay vehículos asignados o plantilla disponible</div>;

  const groupedItems = data.template.items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
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
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                  <span className="text-base flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {responses[item.id] === "no" && (
                      <div className="flex items-center gap-1">
                        {photos[item.id] ? (
                          <div className="relative">
                            <img src={photos[item.id]} alt="Foto" className="w-10 h-10 rounded object-cover border" />
                            <button type="button" onClick={() => setPhotos(prev => { const p = { ...prev }; delete p[item.id]; return p; })}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full text-xs leading-none"
                            >×</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => takePhoto(item.id)}
                            className="text-brand-blue hover:text-brand-green transition text-xl" title="Tomar foto"
                          >
                            📷
                          </button>
                        )}
                      </div>
                    )}
                    {["yes", "no", "na"].map((val) => (
                      <button key={val} type="button" onClick={() => setResponses(prev => ({ ...prev, [item.id]: val }))}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition border ${responses[item.id] === val
                          ? val === "yes" ? "bg-green-500 text-white border-green-500"
                            : val === "no" ? "bg-red-500 text-white border-red-500"
                            : "bg-gray-400 text-white border-gray-400"
                          : "bg-white text-brand-gray border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {val === "yes" ? "Estandar" : val === "no" ? "Bajo Estandar" : "No Aplica"}
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
          {signature ? (
            <div>
              <img src={signature} alt="Firma" className="border border-gray-300 rounded-xl mb-3 h-20" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setSignature(null)} className="border border-gray-300 text-brand-gray font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                  Volver a firmar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-brand-gray/60 text-sm mb-4">Firma con el dedo en el recuadro</p>
              <button type="button" onClick={() => setShowModal(true)} className="bg-brand-blue text-white font-medium px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
                Abrir firmador
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-xl text-brand-blue mb-1">Firma digital</h3>
              <p className="text-brand-gray/60 text-sm mb-4">Firma con el dedo en el recuadro</p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden mb-4 touch-none" style={{ width: "100%", height: 200 }}>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="bg-white cursor-crosshair w-full h-full"
                  style={{ touchAction: "none" }}
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
                <button type="button" onClick={() => { saveSignature(); setShowModal(false); }} className="bg-brand-blue text-white font-medium px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition flex-1">
                  Guardar firma
                </button>
                <button type="button" onClick={clearSignature} className="border border-gray-300 text-brand-gray font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  Limpiar
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 text-brand-gray font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={submitting} className="w-full bg-brand-blue text-white font-heading font-bold text-lg py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          {submitting ? "Enviando..." : "Enviar checklist"}
        </button>
      </form>
    </div>
  );
}
