"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/centros/${params.id}`).then(r => r.json()).then(d => {
      setCenter(d);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/centros/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al actualizar");
      setPending(false);
      return;
    }

    const updated = await res.json();
    setCenter({ ...center, name: updated.name });
    setEditing(false);
    setPending(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este centro? Los usuarios y vehículos asignados quedarán sin centro.")) return;
    setDeleting(true);
    const res = await fetch(`/api/centros/${params.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Error al eliminar");
      setDeleting(false);
      return;
    }
    router.push("/centros");
    router.refresh();
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!center) return <div className="p-10 text-center text-brand-gray/60">Centro no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">
          {editing ? "Editar centro" : center.name}
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

      {editing ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Nombre del centro</label>
            <input name="name" defaultValue={center.name} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-brand-gray/60 mb-1">Usuarios asignados</p>
            <p className="font-heading font-bold text-2xl text-brand-blue">{center.users?.length || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-brand-gray/60 mb-1">Vehículos asignados</p>
            <p className="font-heading font-bold text-2xl text-brand-blue">{center.vehicles?.length || 0}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">Usuarios</h3>
          {center.users?.length === 0 ? (
            <p className="text-brand-gray/60">Sin usuarios asignados</p>
          ) : (
            <div className="space-y-2">
              {center.users?.map((u: any) => (
                <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-brand-gray/60">{u.email} · {u.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-heading font-bold text-xl text-brand-blue mb-4">Vehículos</h3>
          {center.vehicles?.length === 0 ? (
            <p className="text-brand-gray/60">Sin vehículos asignados</p>
          ) : (
            <div className="space-y-2">
              {center.vehicles?.map((v: any) => (
                <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
                  <p className="font-medium text-sm">{v.plate}</p>
                  <p className="text-xs text-brand-gray/60">{v.brand} {v.model} · {v.driver?.name || "Sin conductor"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
