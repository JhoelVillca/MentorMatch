import { useEffect } from 'react';
import { DAYS, DAYS_SHORT, HOURS } from '../../utils/timeEngine';
import { Calendar, Clock, Grid2x2 as Grid, List, CircleAlert as AlertCircle, X, CircleCheck as CheckCircle, Check, CalendarCheck } from 'lucide-react';

const Legend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
    <div className="flex items-center gap-2" title="El mentor está disponible en este horario">
      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200" />
      <span>Disponible</span>
    </div>
    <div className="flex items-center gap-2" title="Este horario ya fue reservado por otra persona">
      <div className="w-5 h-5 rounded-md bg-amber-100/50 border border-amber-200 flex items-center justify-center">
        <div className="w-1.5 h-0.5 rounded-sm bg-amber-400/50" />
      </div>
      <span>Ocupado</span>
    </div>
    <div className="flex items-center gap-2" title="Las horas que estás seleccionando para tu sesión">
      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-600 to-accent-500 shadow-[0_0_8px_rgba(37,99,235,0.3)] border-transparent" />
      <span>Tu selección</span>
    </div>
    <div className="flex items-center gap-2" title="El mentor no atiende en estos horarios">
      <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-100 opacity-60" />
      <span>No disponible</span>
    </div>
  </div>
);

const MenteeGridCell = ({ dayIdx, hour, isAvailable, isOccupied, isSelected, onMouseDown, onMouseEnter }) => {
  let bg = 'bg-slate-50';
  let border = 'border-slate-100';
  let cursor = 'cursor-default';
  let opacity = 'opacity-40 pointer-events-none';
  let innerElement = null;

  if (isSelected) {
    bg = 'bg-gradient-to-br from-primary-600 to-accent-500 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]';
    border = 'border-transparent';
    cursor = 'cursor-pointer';
    opacity = 'opacity-100';
    innerElement = (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 rounded-full bg-white/70" />
      </div>
    );
  } else if (isOccupied) {
    bg = 'bg-amber-100/50';
    border = 'border-amber-200';
    cursor = 'cursor-not-allowed';
    opacity = 'opacity-100';
    innerElement = (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-0.5 rounded-sm bg-amber-400/60" />
      </div>
    );
  } else if (isAvailable) {
    bg = 'bg-emerald-50 hover:bg-emerald-100';
    border = 'border-emerald-200 hover:border-emerald-300';
    cursor = 'cursor-pointer';
    opacity = 'opacity-100';
  }

  let title = 'No disponible';
  if (isSelected) title = 'Seleccionado';
  else if (isOccupied) title = 'Ocupado';
  else if (isAvailable) title = 'Disponible (clic o arrastrar para seleccionar)';

  return (
    <td
      onMouseDown={() => { if (isAvailable && !isOccupied) onMouseDown(dayIdx, hour); }}
      onMouseEnter={() => { if (isAvailable && !isOccupied) onMouseEnter(dayIdx, hour); }}
      className={`relative ${bg} ${border} ${cursor} ${opacity} border select-none transition-all duration-300 h-8`}
      title={`${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00 - ${title}`}
    >
      {innerElement}
    </td>
  );
};

const MenteeWeekGrid = ({ availableSet, occupiedSet, selectedSet, onDragStart, onDragEnter, onDragEnd }) => {
  useEffect(() => {
    const handleMouseUp = () => onDragEnd();
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [onDragEnd]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white text-[10px] text-slate-400 font-medium w-12 py-2 border-b border-slate-200">
              Hora
            </th>
            {DAYS_SHORT.map((day, index) => (
              <th key={index} className="text-xs text-slate-500 font-semibold py-2 px-1 border-b border-slate-200">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td className="sticky left-0 z-10 bg-white text-[10px] text-slate-400 font-mono text-right pr-2 select-none border-r border-slate-100">
                {String(hour).padStart(2, '0')}:00
              </td>
              {DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${hour}`;
                return (
                  <MenteeGridCell
                    key={key}
                    dayIdx={dayIdx}
                    hour={hour}
                    isAvailable={availableSet.has(key)}
                    isOccupied={occupiedSet.has(key)}
                    isSelected={selectedSet.has(key)}
                    onMouseDown={onDragStart}
                    onMouseEnter={onDragEnter}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm';
const selectClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm font-medium';

export default function AgendarSesionUI({
  contratos,
  loadingContratos,
  loadingSlots,
  submitting,
  error,
  success,
  userTZ,
  selectedContratoId,
  setSelectedContratoId,
  viewMode,
  setViewMode,
  availableSet,
  occupiedSet,
  selectedCells,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
  selectionSummary,
  selectionError,
  clearSelection,
  handleSubmitGrid,
  slots,
  selectedSlotId,
  setSelectedSlotId,
  horaInicio,
  setHoraInicio,
  horaFin,
  setHoraFin,
  slotActivo,
  handleSubmitList,
  dismissError,
}) {
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-emerald-100 rounded-3xl p-10 text-center shadow-card-lg max-w-sm w-full mx-auto transform animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border-4 border-white shadow-sm flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">¡Sesión confirmada!</h2>
          <p className="text-slate-500 text-sm font-medium">Todo listo. Te estamos redirigiendo a tus contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Agendar Sesión</h1>
          <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
            Mostrando horarios en tu zona local:
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100 text-primary-700 text-xs font-bold tracking-wide">
              <Clock size={12} />
              {userTZ}
            </span>
          </p>
        </div>

        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid size={14} />Grilla
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <List size={14} />Lista
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm flex-1 font-medium">{error}</p>
          <button onClick={dismissError} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Contract Selector */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 sm:p-8 mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          Selecciona tu contrato activo
        </label>
        {loadingContratos ? (
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ) : contratos.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm font-medium">No tienes contratos activos con este mentor.</p>
            <p className="text-slate-400 text-xs mt-1">Ve al marketplace para adquirir un paquete de horas.</p>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedContratoId}
              onChange={(event) => setSelectedContratoId(event.target.value)}
              className={selectClass}
            >
              <option value="" disabled>Elige el contrato a utilizar...</option>
              {contratos.map((contrato) => (
                <option key={contrato.id_contrato} value={contrato.id_contrato}>
                  {contrato.paquete} — {contrato.horas_consumidas}h consumidas
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingSlots && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-8 animate-pulse">
          <div className="h-6 w-1/3 bg-slate-100 rounded mb-6" />
          <div className="h-[400px] bg-slate-50 rounded-2xl" />
        </div>
      )}

      {viewMode === 'grid' && selectedContratoId && !loadingSlots && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-600">
                Pinta sobre la cuadrícula para seleccionar bloques contiguos.
              </p>
              <Legend />
            </div>

            <MenteeWeekGrid
              availableSet={availableSet}
              occupiedSet={occupiedSet}
              selectedSet={selectedCells}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
            />

            {/* Selection Summary Footer */}
            <div className={`transition-all duration-300 transform origin-top ${selectedCells.size > 0 ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                
                {selectionError ? (
                  <div className="flex items-center gap-3 text-amber-700 text-sm font-medium bg-amber-100/50 p-3 rounded-xl border border-amber-200">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    {selectionError}
                  </div>
                ) : selectionSummary && (
                  <>
                    <div>
                      <h4 className="text-primary-900 font-extrabold text-base flex items-center gap-2">
                        {selectionSummary.dayName}
                        <span className="text-primary-400 font-normal">|</span>
                        {selectionSummary.startLocal} - {selectionSummary.endLocal}
                      </h4>
                      <p className="text-primary-700 text-sm font-medium mt-1">
                        Duración total: <span className="font-bold">{selectionSummary.duration} horas</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={clearSelection}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-primary-200 text-primary-700 bg-white hover:bg-primary-100 transition-all disabled:opacity-50 flex-1 sm:flex-none shadow-sm"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={handleSubmitGrid}
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex-1 sm:flex-none"
                      >
                        {submitting ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Reservando...</>
                        ) : (
                          <><CalendarCheck size={16} />Confirmar Sesión</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {viewMode === 'list' && selectedContratoId && !loadingSlots && (
        <form onSubmit={handleSubmitList} className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
              <List size={16} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reserva Manual</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Día disponible del mentor
              </label>
              <select
                value={selectedSlotId}
                onChange={(event) => { setSelectedSlotId(event.target.value); setHoraInicio(''); setHoraFin(''); }}
                disabled={slots.length === 0}
                className={selectClass}
              >
                <option value="" disabled>
                  {slots.length === 0 ? 'No hay horarios disponibles' : 'Elige un bloque de horas...'}
                </option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
            </div>

            {slotActivo && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ventana del mentor</span>
                  <span className="text-primary-700 bg-primary-50 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                    {slotActivo.localStart} — {slotActivo.localEnd}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Desde las</label>
                    <input
                      type="time"
                      value={horaInicio}
                      min={slotActivo.localStart}
                      max={slotActivo.localEnd}
                      onChange={(event) => setHoraInicio(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Hasta las</label>
                    <input
                      type="time"
                      value={horaFin}
                      min={horaInicio || slotActivo.localStart}
                      max={slotActivo.localEnd}
                      onChange={(event) => setHoraFin(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {horaInicio && horaFin && horaInicio < horaFin && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                    <CheckCircle size={16} className="text-emerald-500" />
                    Duración calculada: {(() => {
                      const [startHours, startMinutes] = horaInicio.split(':').map(Number);
                      const [endHours, endMinutes] = horaFin.split(':').map(Number);
                      const minutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
                      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting || contratos.length === 0 || !slotActivo || !horaInicio || !horaFin}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Reservando...</>
              ) : (
                <><CalendarCheck size={18} />Confirmar Reserva</>
              )}
            </button>
          </div>
        </form>
      )}

      {!selectedContratoId && !loadingContratos && contratos.length > 0 && (
        <div className="border border-dashed border-slate-200 rounded-3xl py-16 text-center bg-white shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-primary-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Casi listo</h3>
          <p className="text-slate-500 text-sm font-medium">Selecciona uno de tus contratos activos arriba para ver la disponibilidad.</p>
        </div>
      )}
    </div>
  );
}
