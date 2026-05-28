"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading font-black text-2xl text-brand-blue">
            Eco<span className="text-brand-green">Mantenimiento</span>
          </h1>
          <p className="text-brand-gray/60 text-sm mt-1">
            Inicia sesión para continuar
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="tu@correo.cl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand-blue text-white font-heading font-bold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
