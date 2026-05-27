import { useEffect } from 'react';
import { DAYS, DAYS_SHORT, HOURS } from '../../utils/timeEngine';

const Legend = () => (
	<div className="flex flex-wrap gap-4 text-xs text-gray-400">
		<div className="flex items-center gap-1.5">
			<div className="w-3.5 h-3.5 rounded bg-emerald-900/60 border border-emerald-800/50" />
			<span>Disponible</span>
		</div>
		<div className="flex items-center gap-1.5">
			<div className="w-3.5 h-3.5 rounded bg-amber-800/50 border border-amber-700/50" />
			<span>Ocupado</span>
		</div>
		<div className="flex items-center gap-1.5">
			<div className="w-3.5 h-3.5 rounded bg-blue-700/50 border border-blue-500/60" />
			<span>Tu selección</span>
		</div>
		<div className="flex items-center gap-1.5">
			<div className="w-3.5 h-3.5 rounded bg-[#111] border border-[#1e1e1e]" />
			<span>No disponible</span>
		</div>
	</div>
);

const MenteeGridCell = ({ dayIdx, hour, isAvailable, isOccupied, isSelected, onMouseDown, onMouseEnter }) => {
	let bg = 'bg-[#111]';
	let border = 'border-[#1e1e1e]';
	let cursor = 'cursor-default';
	let opacity = 'opacity-40';

	if (isOccupied) {
		bg = 'bg-amber-800/50';
		border = 'border-amber-700/50';
		cursor = 'cursor-not-allowed';
		opacity = 'opacity-100';
	} else if (isSelected) {
		bg = 'bg-blue-700/50 hover:bg-blue-600/50';
		border = 'border-blue-500/60';
		cursor = 'cursor-pointer';
		opacity = 'opacity-100';
	} else if (isAvailable) {
		bg = 'bg-emerald-900/60 hover:bg-emerald-800/60';
		border = 'border-emerald-800/50';
		cursor = 'cursor-pointer';
		opacity = 'opacity-100';
	}

	return (
		<td
			onMouseDown={() => { if (isAvailable && !isOccupied) onMouseDown(dayIdx, hour); }}
			onMouseEnter={() => { if (isAvailable && !isOccupied) onMouseEnter(dayIdx, hour); }}
			className={`${bg} ${border} ${cursor} ${opacity} border select-none transition-colors duration-100 h-7`}
			title={`${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00 (hora local)`}
		/>
	);
};

const MenteeWeekGrid = ({ availableSet, occupiedSet, selectedSet, onDragStart, onDragEnter, onDragEnd }) => {
	useEffect(() => {
		const handleMouseUp = () => onDragEnd();
		window.addEventListener('mouseup', handleMouseUp);
		return () => window.removeEventListener('mouseup', handleMouseUp);
	}, [onDragEnd]);

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a]">
			<table className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
				<thead>
					<tr>
						<th className="sticky left-0 z-10 bg-[#0a0a0a] text-[10px] text-gray-600 font-medium w-12 py-2">
							Hora
						</th>
						{DAYS_SHORT.map((day, index) => (
							<th key={index} className="text-xs text-gray-400 font-semibold py-2 px-1">{day}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{HOURS.map((hour) => (
						<tr key={hour}>
							<td className="sticky left-0 z-10 bg-[#0a0a0a] text-[10px] text-gray-600 font-mono text-right pr-2 select-none border-r border-[#1e1e1e]">
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
			<div className="min-h-screen flex items-center justify-center">
				<div className="bg-[#141414] border border-green-600 rounded-2xl p-10 text-center shadow-[0_0_20px_rgba(22,163,74,0.2)]">
					<div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-600 flex items-center justify-center mx-auto mb-4">
						<svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 className="text-xl font-bold text-white mb-1">Sesión confirmada</h2>
					<p className="text-gray-400 text-sm">Redirigiendo a tus contratos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen py-8 px-4">
			<div className="max-w-5xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold text-white">Agendar Sesión</h1>
						<p className="text-gray-500 text-sm mt-1">
							Horarios en tu zona:{' '}
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs font-semibold">
								<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{userTZ}
							</span>
						</p>
					</div>

					<div className="flex bg-[#141414] border border-gray-800 rounded-lg p-0.5 gap-0.5">
						<button
							onClick={() => setViewMode('grid')}
							className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
						>
							<svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
							</svg>
							Grilla
						</button>
						<button
							onClick={() => setViewMode('list')}
							className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
						>
							<svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
							Lista
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-6 bg-red-950/50 border border-red-700 rounded-xl p-4 flex gap-3 items-start">
						<svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p className="text-red-300 text-sm">{error}</p>
						<button onClick={dismissError} className="ml-auto text-red-500 hover:text-red-300">
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				)}

				<div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 shadow-lg mb-6">
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
						Contrato activo
					</label>
					{loadingContratos ? (
						<div className="h-11 bg-[#0d0d0d] rounded-lg animate-pulse" />
					) : contratos.length === 0 ? (
						<p className="text-gray-500 text-sm italic">No tienes contratos activos. Ve al marketplace.</p>
					) : (
						<select
							value={selectedContratoId}
							onChange={(event) => setSelectedContratoId(event.target.value)}
							className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
						>
							<option value="">Selecciona un contrato</option>
							{contratos.map((contrato) => (
								<option key={contrato.id_contrato} value={contrato.id_contrato}>
									{contrato.paquete} — {contrato.horas_consumidas}h usadas
								</option>
							))}
						</select>
					)}
				</div>

				{loadingSlots && <div className="h-[400px] bg-[#0d0d0d] rounded-2xl animate-pulse" />}

				{viewMode === 'grid' && selectedContratoId && !loadingSlots && (
					<div className="space-y-4">
						<div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<p className="text-xs text-gray-500">
									Selecciona las horas que quieres reservar. Solo bloques contiguos del mismo día.
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
						</div>

						{selectedCells.size > 0 && (
							<div className="bg-[#141414] border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
								{selectionError ? (
									<div className="flex items-center gap-2 text-amber-400 text-sm">
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
										</svg>
										{selectionError}
									</div>
								) : selectionSummary && (
									<>
										<div className="flex items-center justify-between">
											<div>
												<p className="text-white font-semibold text-sm">
													{selectionSummary.dayName} — {selectionSummary.startLocal} a {selectionSummary.endLocal}
													<span className="text-gray-500 ml-2 font-normal">(hora local)</span>
												</p>
												<p className="text-gray-500 text-xs mt-1">
													Duración: {selectionSummary.duration}h
												</p>
											</div>
											<div className="flex gap-2">
												<button
													onClick={clearSelection}
													disabled={submitting}
													className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all"
												>
													Limpiar
												</button>
												<button
													onClick={handleSubmitGrid}
													disabled={submitting}
													className="px-5 py-2 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600 text-white transition-all disabled:opacity-60 flex items-center gap-2 active:scale-[0.97]"
												>
													{submitting ? (
														<>
															<svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
															</svg>
															Confirmando...
														</>
													) : 'Confirmar Sesión'}
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>
				)}

				{viewMode === 'list' && selectedContratoId && !loadingSlots && (
					<form onSubmit={handleSubmitList} className="bg-[#141414] border border-gray-800 rounded-2xl p-7 space-y-6 shadow-xl">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
								Bloque disponible del mentor
								<span className="ml-2 normal-case font-normal text-gray-500">(horario en tu zona local)</span>
							</label>
							<select
								value={selectedSlotId}
								onChange={(event) => { setSelectedSlotId(event.target.value); setHoraInicio(''); setHoraFin(''); }}
								disabled={slots.length === 0}
								className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-40 transition-all"
							>
								<option value="">
									{slots.length === 0 ? 'Este mentor no tiene horarios configurados' : 'Selecciona un bloque'}
								</option>
								{slots.map((slot) => (
									<option key={slot.id} value={slot.id}>{slot.label}</option>
								))}
							</select>
						</div>

						{slotActivo && (
							<div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 space-y-4">
								<div className="flex items-center justify-between text-xs text-gray-500">
									<span>Ventana disponible</span>
									<span className="text-gray-300 font-mono">{slotActivo.localStart} — {slotActivo.localEnd}</span>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-xs text-gray-400 mb-1.5">Hora de inicio</label>
										<input
											type="time"
											value={horaInicio}
											min={slotActivo.localStart}
											max={slotActivo.localEnd}
											onChange={(event) => setHoraInicio(event.target.value)}
											className="w-full bg-[#141414] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-400 mb-1.5">Hora de fin</label>
										<input
											type="time"
											value={horaFin}
											min={horaInicio || slotActivo.localStart}
											max={slotActivo.localEnd}
											onChange={(event) => setHoraFin(event.target.value)}
											className="w-full bg-[#141414] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
										/>
									</div>
								</div>
								{horaInicio && horaFin && horaInicio < horaFin && (
									<div className="flex items-center gap-2 text-xs text-green-400">
										<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
										Duración: {(() => {
											const [startHours, startMinutes] = horaInicio.split(':').map(Number);
											const [endHours, endMinutes] = horaFin.split(':').map(Number);
											const minutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
											return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
										})()}
									</div>
								)}
							</div>
						)}

						<button
							type="submit"
							disabled={submitting || contratos.length === 0 || !slotActivo || !horaInicio || !horaFin}
							className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] text-sm"
						>
							{submitting ? (
								<span className="flex items-center justify-center gap-2">
									<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Confirmando reserva...
								</span>
							) : 'Confirmar Sesión'}
						</button>
					</form>
				)}

				{!selectedContratoId && !loadingContratos && contratos.length > 0 && (
					<div className="border border-dashed border-gray-800 rounded-xl py-16 text-center">
						<svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p className="text-gray-500 text-sm">Selecciona un contrato para ver la disponibilidad del mentor.</p>
					</div>
				)}
			</div>
		</div>
	);
}
