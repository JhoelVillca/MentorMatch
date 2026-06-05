import { Video, ShieldCheck, Clock, CreditCard } from 'lucide-react';

const benefits = [
  {
    icon: Video,
    title: 'Videollamadas Integradas',
    description:
      'Sesiones 1 a 1 en tiempo real con calidad HD. Sin salir de la plataforma, sin enlaces rotos.',
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: ShieldCheck,
    title: 'Pagos Seguros con Stripe',
    description:
      'Tu dinero protegido con Stripe Connect. Preautorización, captura y comprobantes automáticos.',
    gradient: 'from-accent-500 to-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Clock,
    title: 'Cero Colisiones de Horario',
    description:
      'Motor de agendamiento con bloqueo pesimista. Nunca dos personas reservan el mismo bloque.',
    gradient: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: CreditCard,
    title: 'Paquetes Transparentes',
    description:
      'Elige paquetes de horas con precio fijo. Sin sorpresas, sin cargos ocultos. Recibos al instante.',
    gradient: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="relative py-24 sm:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">
            Beneficios
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Todo lo que necesitas en{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">un solo lugar</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Construimos cada feature pensando en tu experiencia. Sin fricción,
            sin trabas, sin intermediarios innecesarios.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {benefits.map(({ icon: Icon, title, description, gradient, bg, border }) => (
            <div
              key={title}
              className="group relative rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-5`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
