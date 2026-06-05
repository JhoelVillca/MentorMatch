import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-100/40 blur-[128px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent-100/30 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 border border-accent-200 mb-8">
          <Zap className="w-4 h-4 text-accent-600" />
          <span className="text-sm font-medium text-accent-700">
            Comienza hoy, sin compromiso
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
          Tu próxima carrera empieza{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">con una conversación</span>
        </h2>

        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Encuentra al mentor perfecto, agenda tu primera sesión y experimenta
          el poder del aprendizaje personalizado. Miles de profesionales ya
          confían en MentorMatch.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/catalog"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-600/20 hover:shadow-primary-500/30 hover:from-primary-500 hover:to-primary-400 transition-all duration-300"
          >
            Explorar Mentores
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/register"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-2xl hover:bg-primary-100 hover:border-primary-300 transition-all duration-300"
          >
            Quiero ser Mentor
          </Link>
        </div>
      </div>
    </section>
  );
}
