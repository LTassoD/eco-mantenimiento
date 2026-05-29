"use client";

import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Inicio", roles: ["ADMIN", "DRIVER", "SUPERVISOR", "MECHANIC", "MANAGER"] },
  { href: "/checklist", label: "Checklist", roles: ["ADMIN", "SUPERVISOR", "DRIVER"] },
  { href: "/checklist/historial", label: "Historial", roles: ["ADMIN", "SUPERVISOR", "DRIVER"] },
  { href: "/checklist/revisar", label: "Revisar", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/centros", label: "Centros", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/vehiculos", label: "Vehículos", roles: ["ADMIN", "SUPERVISOR", "MANAGER"] },
  { href: "/maintenance", label: "Mantenimiento", roles: ["ADMIN", "SUPERVISOR", "MECHANIC", "MANAGER"] },
  { href: "/reports", label: "Reportes", roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/users", label: "Usuarios", roles: ["ADMIN", "SUPERVISOR"] },
];

export function MobileNav({ role, userName, roleLabel }: { role: string; userName: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const filtered = links.filter(l => l.roles.includes(role));

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm opacity-80">{userName}</span>
        <span className="hidden sm:inline bg-white/20 px-3 py-1 rounded text-xs">{roleLabel}</span>
        <button onClick={() => setOpen(!open)} className="sm:hidden p-1.5 hover:bg-white/10 rounded-lg transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="sm:hidden fixed inset-0 top-16 z-50 bg-white">
          <nav className="flex flex-col p-6 gap-4 text-lg">
            {filtered.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="text-brand-gray hover:text-brand-blue font-medium transition-colors"
              >
                {l.label}
              </a>
            ))}
            <hr className="my-2 border-gray-200" />
            <div className="flex items-center gap-3 text-brand-gray/60 text-sm">
              <span>{userName}</span>
              <span className="bg-brand-blue/10 px-2 py-0.5 rounded text-xs">{roleLabel}</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export function DesktopNav({ role }: { role: string }) {
  const filtered = links.filter(l => l.roles.includes(role));
  return (
    <div className="hidden sm:flex gap-8 text-base">
      {filtered.map(l => (
        <a key={l.href} href={l.href}
          className="text-brand-gray hover:text-brand-blue font-medium transition-colors whitespace-nowrap"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
