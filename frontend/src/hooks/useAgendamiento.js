import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import {
	buildAvailableSetLocal,
	buildOccupiedSetLocal,
	buildSlots,
	buildUTCPayload,
	DAYS,
	nextOccurrence,
} from '../utils/timeEngine';

const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useAgendamiento() {
	const navigate = useNavigate();

	const [contratos, setContratos] = useState([]);
	const [disponibilidades, setDisponibilidades] = useState([]);
	const [sesionesOcupadas, setSesionesOcupadas] = useState([]);

	const [selectedContratoId, setSelectedContratoId] = useState('');
	const [viewMode, setViewMode] = useState('grid');

	const [selectedCells, setSelectedCells] = useState(new Set());
	const [dragMode, setDragMode] = useState(null);
	const [dragDay, setDragDay] = useState(null);

	const [selectedSlotId, setSelectedSlotId] = useState('');
	const [horaInicio, setHoraInicio] = useState('');
	const [horaFin, setHoraFin] = useState('');

	const [loadingContratos, setLoadingContratos] = useState(true);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	const contratoSeleccionado = useMemo(
		() => contratos.find((c) => c.id_contrato === selectedContratoId) ?? null,
		[contratos, selectedContratoId],
	);

	const slots = useMemo(() => buildSlots(disponibilidades), [disponibilidades]);
	const availableSet = useMemo(() => buildAvailableSetLocal(disponibilidades), [disponibilidades]);
	const occupiedSet = useMemo(() => buildOccupiedSetLocal(sesionesOcupadas), [sesionesOcupadas]);
	const slotActivo = useMemo(
		() => slots.find((slot) => slot.id === selectedSlotId) ?? null,
		[slots, selectedSlotId],
	);

	const cargarDatos = useCallback(async (idMentor, signal) => {
		setLoadingSlots(true);
		setDisponibilidades([]);
		setSesionesOcupadas([]);
		setSelectedCells(new Set());
		setSelectedSlotId('');
		setHoraInicio('');
		setHoraFin('');

		try {
			const [dispData, ocupData] = await Promise.all([
				apiClient(`/api/disponibilidad/mentor/${idMentor}`, { method: 'GET', signal }),
				apiClient(`/api/sesiones/ocupadas/${idMentor}`, { method: 'GET', signal }),
			]);

			if (!signal.aborted) {
				setDisponibilidades(dispData);
				setSesionesOcupadas(ocupData);
				setError(null);
			}
		} catch (err) {
			if (err.name !== 'AbortError' && !signal.aborted) {
				setError(err.message);
			}
		} finally {
			if (!signal.aborted) {
				setLoadingSlots(false);
			}
		}
	}, []);

	useEffect(() => {
		const controller = new AbortController();

		apiClient('/api/contratos/me', { method: 'GET', signal: controller.signal })
			.then((data) => setContratos(data.filter((contrato) => contrato.estado === 'activo')))
			.catch((err) => {
				if (err.name !== 'AbortError' && !controller.signal.aborted) {
					if (err.status === 403) navigate('/mentee/completar-perfil');
					else setError(err.message);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setLoadingContratos(false);
				}
			});

		return () => controller.abort();
	}, []);

	useEffect(() => {
		setDisponibilidades([]);
		setSesionesOcupadas([]);
		setSelectedCells(new Set());
		setSelectedSlotId('');
		setHoraInicio('');
		setHoraFin('');

		if (!contratoSeleccionado?.id_mentor) {
			setLoadingSlots(false);
			return undefined;
		}

		const controller = new AbortController();
		cargarDatos(contratoSeleccionado.id_mentor, controller.signal);

		return () => controller.abort();
	}, [contratoSeleccionado, cargarDatos]);

	const handleDragStart = useCallback((dayIdx, hour) => {
		const key = `${dayIdx}-${hour}`;
		if (occupiedSet.has(key)) return;

		if (selectedCells.has(key)) {
			setDragMode('deselect');
			setDragDay(dayIdx);
			setSelectedCells((prev) => {
				const next = new Set(prev);
				next.delete(key);
				return next;
			});
		} else {
			setDragMode('select');
			setDragDay(dayIdx);
			setSelectedCells((prev) => {
				const next = new Set(prev);
				next.add(key);
				return next;
			});
		}
	}, [occupiedSet, selectedCells]);

	const handleDragEnter = useCallback((dayIdx, hour) => {
		if (!dragMode || dayIdx !== dragDay) return;

		const key = `${dayIdx}-${hour}`;
		if (occupiedSet.has(key)) return;

		if (dragMode === 'select') {
			setSelectedCells((prev) => {
				const next = new Set(prev);
				next.add(key);
				return next;
			});
		} else {
			setSelectedCells((prev) => {
				const next = new Set(prev);
				next.delete(key);
				return next;
			});
		}
	}, [dragDay, dragMode, occupiedSet]);

	const handleDragEnd = useCallback(() => {
		setDragMode(null);
		setDragDay(null);
	}, []);

	const validateSelection = useCallback(() => {
		if (selectedCells.size === 0) return null;

		const byDay = {};
		selectedCells.forEach((key) => {
			const [dayPart, hourPart] = key.split('-').map(Number);
			if (!byDay[dayPart]) byDay[dayPart] = [];
			byDay[dayPart].push(hourPart);
		});

		const days = Object.keys(byDay);
		if (days.length > 1) return 'Solo puedes seleccionar horas de un mismo día por sesión.';

		const dayIdx = Number(days[0]);
		const hours = byDay[dayIdx].sort((a, b) => a - b);

		for (let i = 1; i < hours.length; i += 1) {
			if (hours[i] !== hours[i - 1] + 1) return 'Las horas seleccionadas deben ser contiguas.';
		}

		if (hours.length < 1) return 'Selecciona al menos 1 hora.';

		return null;
	}, [selectedCells]);

	const selectionSummary = useMemo(() => {
		if (selectedCells.size === 0) return null;

		const byDay = {};
		selectedCells.forEach((key) => {
			const [dayPart, hourPart] = key.split('-').map(Number);
			if (!byDay[dayPart]) byDay[dayPart] = [];
			byDay[dayPart].push(hourPart);
		});

		const dayIdx = Number(Object.keys(byDay)[0]);
		const hours = byDay[dayIdx].sort((a, b) => a - b);
		const startHour = hours[0];
		const endHour = hours[hours.length - 1] + 1;

		return {
			dayIdx,
			dayName: DAYS[dayIdx],
			startHour,
			endHour,
			startLocal: `${String(startHour).padStart(2, '0')}:00`,
			endLocal: `${String(endHour).padStart(2, '0')}:00`,
			duration: hours.length,
		};
	}, [selectedCells]);

	const selectionError = useMemo(() => validateSelection(), [validateSelection]);

	const clearSelection = useCallback(() => {
		setSelectedCells(new Set());
	}, []);

	const handleSubmitGrid = useCallback(async () => {
		const validationError = validateSelection();
		if (validationError) {
			setError(validationError);
			return;
		}

		if (!selectionSummary) return;

		const { dayIdx, startHour, endHour } = selectionSummary;
		if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
			setError('No se pudo interpretar la hora seleccionada.');
			return;
		}

		const startDate = nextOccurrence(dayIdx, startHour);
		const endDate = new Date(startDate.getTime() + ((endHour - startHour) * 3600000));

		setSubmitting(true);
		setError(null);

		try {
			await apiClient('/api/sesiones/agendar', {
				method: 'POST',
				body: {
					id_contrato: selectedContratoId,
					fecha_hora_inicio_utc: startDate.toISOString(),
					fecha_hora_fin_utc: endDate.toISOString(),
				},
			});
			setSuccess(true);
			setTimeout(() => navigate('/mentee/contratos'), 2000);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}, [navigate, selectedContratoId, selectionSummary, validateSelection]);

	const validarHorario = useCallback(() => {
		if (!selectedContratoId || !selectedSlotId || !horaInicio || !horaFin) {
			setError('Completa todos los campos antes de continuar.');
			return false;
		}

		if (horaInicio >= horaFin) {
			setError('La hora de fin debe ser posterior a la de inicio.');
			return false;
		}

		if (slotActivo && (horaInicio < slotActivo.localStart || horaFin > slotActivo.localEnd)) {
			setError(`El horario escapa de la ventana: ${slotActivo.localStart} - ${slotActivo.localEnd}.`);
			return false;
		}

		return true;
	}, [horaFin, horaInicio, selectedContratoId, selectedSlotId, slotActivo]);

	const handleSubmitList = useCallback(async (event) => {
		event.preventDefault();
		setError(null);

		if (!validarHorario() || !slotActivo) return;

		const inicioISO = buildUTCPayload(slotActivo.startUTC, horaInicio);
		const finISO = buildUTCPayload(slotActivo.startUTC, horaFin);

		setSubmitting(true);

		try {
			await apiClient('/api/sesiones/agendar', {
				method: 'POST',
				body: {
					id_contrato: selectedContratoId,
					fecha_hora_inicio_utc: inicioISO,
					fecha_hora_fin_utc: finISO,
				},
			});
			setSuccess(true);
			setTimeout(() => navigate('/mentee/contratos'), 2000);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}, [horaFin, horaInicio, navigate, selectedContratoId, slotActivo, validarHorario]);

	const dismissError = useCallback(() => setError(null), []);

	return {
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
	};
}
