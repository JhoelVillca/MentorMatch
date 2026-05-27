export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export const DIA_STR_TO_INT = {
	Lunes: 1,
	Martes: 2,
	Miércoles: 3,
	Jueves: 4,
	Viernes: 5,
	Sábado: 6,
	Domingo: 7,
	Miercoles: 3,
	Sabado: 6,
};

export const getLocalOffset = () => -(new Date().getTimezoneOffset() / 60);

export const utcToLocal = (dayIdx, hour) => {
	const offset = getLocalOffset();
	let localHour = hour + offset;
	let localDay = dayIdx;

	if (localHour < 0) {
		localHour += 24;
		localDay = (localDay - 1 + 7) % 7;
	}

	if (localHour >= 24) {
		localHour -= 24;
		localDay = (localDay + 1) % 7;
	}

	return { dayIdx: localDay, hour: Math.floor(localHour) };
};

export const localToUTC = (dayIdx, hour) => {
	const offset = getLocalOffset();
	let utcHour = hour - offset;
	let utcDay = dayIdx;

	if (utcHour < 0) {
		utcHour += 24;
		utcDay = (utcDay - 1 + 7) % 7;
	}

	if (utcHour >= 24) {
		utcHour -= 24;
		utcDay = (utcDay + 1) % 7;
	}

	return { dayIdx: utcDay, hour: Math.floor(utcHour) };
};

export const format24h = (dateObj) => {
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
};

export const parseTime24h = (timeStr) => {
	const [rawHours = '0', rawMinutes = '0'] = String(timeStr ?? '00:00').split(':');
	const hours = Number.parseInt(rawHours, 10);
	const minutes = Number.parseInt(rawMinutes, 10);

	return {
		hour: Number.isFinite(hours) ? hours : 0,
		minute: Number.isFinite(minutes) ? minutes : 0,
	};
};

export const normalizeDayIndex = (dayValue) => {
	if (typeof dayValue === 'number') {
		return Math.max(0, Math.min(6, dayValue - 1));
	}

	return Math.max(0, Math.min(6, (DIA_STR_TO_INT[dayValue] ?? 1) - 1));
};

const getNextOccurrenceUTC = (targetDayISO, startHour, startMinute) => {
	const now = new Date();
	const nowUTCDay = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
	let diff = targetDayISO - nowUTCDay;

	if (diff <= 0) {
		diff += 7;
	}

	return new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() + diff,
		startHour,
		startMinute,
		0,
		0,
	));
};

export const nextOccurrence = (dayIdxLocal, hourLocal, minuteLocal = 0) => {
	const utc = localToUTC(dayIdxLocal, hourLocal);
	const now = new Date();
	const nowUTCDay = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
	let diff = utc.dayIdx - nowUTCDay;

	if (diff <= 0) {
		diff += 7;
	}

	return new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() + diff,
		utc.hour,
		minuteLocal,
		0,
		0,
	));
};

export const buildAvailableSetLocal = (disponibilidades) => {
	const set = new Set();

	disponibilidades.forEach((d) => {
		const dayIdx = normalizeDayIndex(d.dia_semana);
		const { hour: startHour } = parseTime24h(d.hora_inicio);
		const { hour: endHour } = parseTime24h(d.hora_fin);

		for (let hour = startHour; hour < endHour; hour += 1) {
			const local = utcToLocal(dayIdx, hour);
			set.add(`${local.dayIdx}-${local.hour}`);
		}
	});

	return set;
};

export const buildOccupiedSetLocal = (sesiones) => {
	const set = new Set();

	sesiones.forEach((s) => {
		const start = new Date(s.fecha_hora_inicio_utc);
		const end = new Date(s.fecha_hora_fin_utc);
		const current = new Date(start);

		while (current < end) {
			const dayIdx = current.getDay() === 0 ? 6 : current.getDay() - 1;
			const hour = current.getHours();
			set.add(`${dayIdx}-${hour}`);
			current.setHours(current.getHours() + 1);
		}
	});

	return set;
};

export const buildSlots = (disponibilidades) =>
	disponibilidades.map((d) => {
		const diaIdx = normalizeDayIndex(d.dia_semana);
		const dayIso = diaIdx + 1;
		const { hour: startHour, minute: startMinute } = parseTime24h(d.hora_inicio);
		const { hour: endHour, minute: endMinute } = parseTime24h(d.hora_fin);
		const startUTC = getNextOccurrenceUTC(dayIso, startHour, startMinute);
		const endUTC = getNextOccurrenceUTC(dayIso, endHour, endMinute);
		const localStart = format24h(startUTC);
		const localEnd = format24h(endUTC);
		const localDate = startUTC.toLocaleDateString(undefined, {
			weekday: 'long',
			day: 'numeric',
			month: 'short',
		});

		return {
			id: d.id,
			diaLabel: typeof d.dia_semana === 'string' ? d.dia_semana : `Dia ${dayIso}`,
			localDate,
			localStart,
			localEnd,
			startUTC,
			endUTC,
			label: `${localDate} — ${localStart} a ${localEnd} (hora local)`,
		};
	});

export const buildUTCPayload = (slotStartUTC, localTime24h) => {
	const { hour, minute } = parseTime24h(localTime24h);
	const local = new Date(slotStartUTC.getTime());
	local.setHours(hour, minute, 0, 0);
	return local.toISOString();
};
