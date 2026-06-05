import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Carolina Méndez',
    role: 'UX Designer @ Rappi',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    quote:
      'En 3 meses pasé de junior a senior con mi mentor. Las sesiones 1 a 1 y el agendamiento sin fricción cambiaron mi carrera.',
    rating: 5,
  },
  {
    name: 'Diego Ramírez',
    role: 'Full-Stack Dev @ Mercado Libre',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    quote:
      'Los pagos con Stripe son instantáneos y seguros. Nunca tuve un problema con doble reserva de horario. La plataforma es sólida.',
    rating: 5,
  },
  {
    name: 'Ana Lucía Torres',
    role: 'Data Scientist @ Nubank',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    quote:
      'Como mentora, MentorMatch me permite gestionar mi disponibilidad y paquetes sin complicaciones. Las videollamadas integradas son un game changer.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="relative py-24 sm:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">
            Testimonios
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Historias que{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">hablan por sí solas</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Miles de profesionales ya aceleraron su carrera con MentorMatch.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, avatar, quote, rating }) => (
            <div
              key={name}
              className="group relative rounded-2xl p-7 bg-white border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-500"
            >
              <Quote className="w-8 h-8 text-primary-200 mb-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">"{quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img
                  src={avatar}
                  alt={name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{name}</div>
                  <div className="text-xs text-slate-500">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
