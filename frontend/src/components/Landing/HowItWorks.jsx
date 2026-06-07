import { Search, Handshake, CalendarCheck, Rocket } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Busca tu mentor ideal',
    description:
      'Filtra por habilidad, precio, disponibilidad y zona horaria. Solo mentores verificados aparecen en el catálogo.',
  },
  {
    icon: Handshake,
    step: '02',
    title: 'Elige tu paquete de horas',
    description:
      'Paquetes transparentes con precio fijo. Paga seguro con Stripe y recibe tu comprobante al instante.',
  },
  {
    icon: CalendarCheck,
    step: '03',
    title: 'Agenda sin colisiones',
    description:
      'Reserva sesiones dentro de las franjas disponibles del mentor. El sistema bloquea el horario en tiempo real.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Conecta y crece',
    description:
      'Videollamada integrada, chat 1 a 1 y seguimiento de horas consumidas. Todo desde una sola plataforma.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-24 sm:py-32 bg-white">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">
            La Plataforma
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            ¿Qué es <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">MentorMatch?</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            MentorMatch es el puente entre las personas que desean aprender habilidades específicas y expertos dispuestos a enseñar. Sin cursos masivos ni ataduras: solo enseñanza 1 a 1 de alto impacto.
          </p>
        </div>

        {/* Roles & Packages explanation */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mentees (Estudiantes)</h3>
            <p className="text-sm text-slate-500">
              Personas motivadas por aprender rápido. Buscan confianza, flexibilidad y acceso directo a expertos para dominar nuevas habilidades sin depender de programas largos.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Paquetes de Horas</h3>
            <p className="text-sm text-slate-500">
              Opciones de aprendizaje flexibles. Adquiere un paquete de horas y agéndalas según tu disponibilidad. El sistema se encarga de evitar colisiones y organizar tus sesiones.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mentores (Expertos)</h3>
            <p className="text-sm text-slate-500">
              Especialistas que buscan visibilidad, monetizar su conocimiento y gestionar fácilmente sus sesiones a través de herramientas como reservas, pagos seguros y videollamadas.
            </p>
          </div>
        </div>

        {/* Steps header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cómo empezar
          </h2>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map(({ icon: Icon, step, title, description }, i) => (
            <div key={step} className="relative group">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-primary-300/40 to-primary-200/10" />
              )}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-50 border border-primary-100 group-hover:border-primary-200 group-hover:bg-primary-100/60 transition-all duration-500 mb-6">
                  <Icon className="w-8 h-8 text-primary-600" />
                  <span className="absolute -top-2 -right-2 text-xs font-bold text-primary-600 bg-primary-100 border border-primary-200 rounded-lg px-2 py-0.5">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
