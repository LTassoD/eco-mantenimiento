"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const roles = [
  { value: "ADMIN", label: "Administrador" },
  { value: "DRIVER", label: "Conductor" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "MECHANIC", label: "Mecánico" },
  { value: "MANAGER", label: "Gerencia" },
];

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/vehiculos/datos").then(r => r.json()),
      fetch(`/api/admin/users/${params.id}`).then(r => r.json()),
    ]).then(([datos, u]) => {
      setCenters(datos.centers);
      setUser(u);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body: Record<string, any> = {
      id: params.id,
      name: form.get("name"),
      email: form.get("email"),
      role: form.get("role"),
      workCenterId: form.get("workCenterId") || null,
      isActive: form.get("isActive") === "on",
    };
    const password = form.get("password") as string;
    if (password) body.password = password;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al actualizar");
      setPending(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Error al eliminar");
      setDeleting(false);
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  if (loading) return <div className="p-10 text-center text-brand-gray/60">Cargando...</div>;
  if (!user) return <div className="p-10 text-center text-brand-gray/60">Usuario no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-bold text-3xl text-brand-blue">Editar usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Nombre</label>
            <input name="name" defaultValue={user.name} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Email</label>
            <input name="email" type="email" defaultValue={user.email} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1.5">Nueva contraseña (dejar vacío para mantener)</label>
          <input name="password" type="password" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Solo si quieres cambiarla" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Rol</label>
            <select name="role" defaultValue={user.role} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1.5">Centro de trabajo</label>
            <select name="workCenterId" defaultValue={user.workCenterId || ""} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-blue bg-white">
              <option value="">Sin centro</option>
              {centers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-gray">
            <input name="isActive" type="checkbox" defaultChecked={user.isActive} className="w-4 h-4" />
            Usuario activo
          </label>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={pending} className="bg-brand-blue text-white font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="border border-red-300 text-red-600 font-medium px-6 py-3 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar usuario"}
          </button>
          <a href="/admin/users" className="border border-gray-300 text-brand-gray font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
