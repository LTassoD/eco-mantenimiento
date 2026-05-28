export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-brand-blue text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading font-bold text-xl tracking-tight">
            Eco<span className="text-brand-neon">Mantenimiento</span>
          </h1>
          <nav className="flex gap-6 text-sm font-medium">
            <span className="opacity-80 hover:opacity-100 cursor-pointer">Checklist</span>
            <span className="opacity-80 hover:opacity-100 cursor-pointer">Mantenimiento</span>
            <span className="opacity-80 hover:opacity-100 cursor-pointer">Reportes</span>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-brand-blue text-white">
          <div className="max-w-6xl mx-auto px-4 py-24 md:py-32">
            <h2 className="font-heading font-black text-4xl md:text-5xl leading-tight mb-6">
              Control de flota
              <span className="text-brand-neon"> simple y eficiente</span>
            </h2>
            <p className="text-lg md:text-xl max-w-2xl opacity-90 mb-8">
              Checklist diario, órdenes de mantenimiento y trazabilidad completa
              para los vehículos de Ecológica.
            </p>
            <div className="flex gap-4">
              <div className="bg-brand-neon text-brand-blue font-heading font-bold px-6 py-3 rounded-lg cursor-pointer hover:opacity-90 transition">
                Iniciar sesión
              </div>
              <div className="border border-white text-white font-heading font-bold px-6 py-3 rounded-lg cursor-pointer hover:bg-white/10 transition">
                Más información
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-light py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-brand-gray text-center mb-12">
              ¿Qué puedes hacer aquí?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Checklist Diario",
                  desc: "Registra el estado del camión al inicio de cada turno con fotos desde tu celular.",
                  icon: "📋",
                },
                {
                  title: "Órdenes de Mantenimiento",
                  desc: "Reporta fallas, asigna mecánicos y da seguimiento a cada reparación.",
                  icon: "🔧",
                },
                {
                  title: "Dashboard Gerencia",
                  desc: "Visualiza KPIs, alertas de mantenimiento preventivo y reportes históricos.",
                  icon: "📊",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h4 className="font-heading font-bold text-lg text-brand-blue mb-2">
                    {item.title}
                  </h4>
                  <p className="text-brand-gray/80 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brand-blue text-white/60 text-sm py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          EcoMantenimiento © {new Date().getFullYear()} — Ecológica
        </div>
      </footer>
    </div>
  );
}
