import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-200/40 blur-[128px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent-200/30 blur-[128px] animate-pulse-slow" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-primary-100/40 blur-[128px] animate-pulse-slow" />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Plataforma de Mentoría #1 en LATAM
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up">
            <span className="text-slate-900">Impulsa tu carrera con</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">expertos de la industria</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up-delay">
            Conecta con mentores verificados, agenda sesiones 1 a 1 y acelera
            tu crecimiento profesional con videollamadas integradas y pagos
            seguros.
          </p>

          {/* CTAs */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up-delay-2">
            <Link
              to="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-600/20 hover:shadow-primary-500/30 hover:from-primary-500 hover:to-primary-400 transition-all duration-300"
            >
              Quiero Aprender
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/catalog"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all duration-300"
            >
              Explorar Mentores
            </Link>
            <Link
              to="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-2xl hover:bg-primary-100 hover:border-primary-300 transition-all duration-300"
            >
              Quiero ser Mentor
              <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
            {[
              { value: '2,500+', label: 'Mentores Verificados', icon: Users },
              { value: '15K+', label: 'Sesiones Completadas', icon: Sparkles },
              { value: '4.9', label: 'Calificación Promedio', icon: TrendingUp },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 mb-3">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
