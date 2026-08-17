import * as Astronomy from 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/+esm';

// ---------- Datos ----------

const ZODIAC = [
  { name: 'Aries',        symbol: '♈', meaning: 'impulso, coraje y comienzos' },
  { name: 'Tauro',        symbol: '♉', meaning: 'estabilidad, placer y constancia' },
  { name: 'Géminis',      symbol: '♊', meaning: 'curiosidad, palabras e ideas en movimiento' },
  { name: 'Cáncer',       symbol: '♋', meaning: 'emoción, hogar e intuición' },
  { name: 'Leo',          symbol: '♌', meaning: 'brillo, expresión y orgullo propio' },
  { name: 'Virgo',        symbol: '♍', meaning: 'orden, análisis y cuidado del detalle' },
  { name: 'Libra',        symbol: '♎', meaning: 'equilibrio, vínculos y armonía' },
  { name: 'Escorpio',     symbol: '♏', meaning: 'intensidad, transformación y profundidad' },
  { name: 'Sagitario',    symbol: '♐', meaning: 'expansión, libertad y búsqueda de verdad' },
  { name: 'Capricornio',  symbol: '♑', meaning: 'disciplina, ambición y estructura' },
  { name: 'Acuario',      symbol: '♒', meaning: 'originalidad, comunidad y ruptura de moldes' },
  { name: 'Piscis',       symbol: '♓', meaning: 'sensibilidad, sueños y disolución de límites' },
];

const PHASES = [
  { max: 22.5,  name: 'Luna Nueva',        text: 'Página en blanco: momento de sembrar intenciones antes de que la luz vuelva a crecer.' },
  { max: 67.5,  name: 'Luna Creciente',    text: 'El impulso empieza a tomar forma. Sostené lo que iniciaste con paciencia.' },
  { max: 112.5, name: 'Cuarto Creciente',  text: 'Primeras fricciones: esta fase pide decidir y ajustar el rumbo.' },
  { max: 157.5, name: 'Gibosa Creciente',  text: 'Se afinan los detalles antes del clímax. Revisá, corregí, seguí construyendo.' },
  { max: 202.5, name: 'Luna Llena',        text: 'Punto máximo de luz: lo que sembraste se revela, y también lo que pesa.' },
  { max: 247.5, name: 'Gibosa Menguante',  text: 'Cosecha y gratitud. Es momento de compartir lo aprendido.' },
  { max: 292.5, name: 'Cuarto Menguante',  text: 'Soltar lo que ya cumplió su función. Espacio para cerrar ciclos.' },
  { max: 337.5, name: 'Luna Menguante',    text: 'Descanso antes del nuevo comienzo. Silencio fértil.' },
  { max: 360.1, name: 'Luna Nueva',        text: 'Página en blanco: momento de sembrar intenciones antes de que la luz vuelva a crecer.' },
];

const FALLBACK_COORDS = { lat: 19.4326, lon: -99.1332, label: 'Ciudad de México (por defecto)' };
let currentLat = FALLBACK_COORDS.lat;
let currentLon = FALLBACK_COORDS.lon;

// ---------- Helpers de cálculo ----------

function getPhase(angleDeg) {
  return PHASES.find(p => angleDeg < p.max);
}

function getZodiacSign(eclipticLonDeg) {
  const norm = ((eclipticLonDeg % 360) + 360) % 360;
  const idx = Math.floor(norm / 30);
  return ZODIAC[idx];
}

function fmtTime(astroTime) {
  if (!astroTime) return null;
  return astroTime.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

async function computeMoonData(lat, lon) {
  const now = new Date();
  const time = Astronomy.MakeTime(now);
  const observer = new Astronomy.Observer(lat, lon, 0);

  const phaseAngle = Astronomy.MoonPhase(time);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, time);
  const eclip = Astronomy.EclipticGeoMoon(time);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const searchStart = Astronomy.MakeTime(startOfDay);

  let rise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, searchStart, 1.5);
  let set = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, searchStart, 1.5);

  return {
    phase: getPhase(phaseAngle),
    illumPercent: illum.phase_fraction * 100,
    sign: getZodiacSign(eclip.lon),
    rise,
    set,
  };
}

// ---------- Render: Hoy ----------

function renderMoonDisc(phaseAngleDeg) {
  // p: 0 = luna nueva, 0.5 = llena, 1 = nueva otra vez.
  const p = ((phaseAngleDeg % 360) + 360) % 360 / 360;
  const R = 86;
  const theta = p * 2 * Math.PI;
  const rx = Math.abs(R * Math.cos(theta));

  // Los "sweep flags" determinan de qué lado se curva cada arco según el cuarto de fase.
  let sweep1, sweep2;
  if (p < 0.25)      { sweep1 = 1; sweep2 = 1; }
  else if (p < 0.5)   { sweep1 = 0; sweep2 = 1; }
  else if (p < 0.75)  { sweep1 = 1; sweep2 = 0; }
  else                { sweep1 = 0; sweep2 = 0; }

  const d = `M 0,${-R} A ${rx},${R} 0 0,${sweep1} 0,${R} A ${R},${R} 0 0,${sweep2} 0,${-R} Z`;
  document.getElementById('lit-path').setAttribute('d', d);
}

function drawRingTicks() {
  const g = document.getElementById('ring-ticks');
  if (g.childElementCount) return;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI;
    const r1 = 148, r2 = i % 6 === 0 ? 140 : 144;
    const x1 = 160 + r1 * Math.sin(angle), y1 = 160 - r1 * Math.cos(angle);
    const x2 = 160 + r2 * Math.sin(angle), y2 = 160 - r2 * Math.cos(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'var(--accent-gold-dim)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.5');
    g.appendChild(line);
  }
}

async function loadToday(lat, lon, locationLabel) {
  currentLat = lat;
  currentLon = lon;
  document.getElementById('date-label').textContent =
    new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  drawRingTicks();

  try {
    const data = await computeMoonData(lat, lon);
    const angle = Astronomy.MoonPhase(Astronomy.MakeTime(new Date()));

    renderMoonDisc(angle);
    document.getElementById('illum-pct').textContent = `${data.illumPercent.toFixed(0)}%`;
    document.getElementById('phase-name').textContent = data.phase.name;

    document.getElementById('sign-symbol').textContent = data.sign.symbol;
    document.getElementById('sign-name').textContent = data.sign.name;
    document.getElementById('horoscope-text').textContent =
      `${data.phase.text} La energía de ${data.sign.name} suma ${data.sign.meaning}.`;

    document.getElementById('moonrise').textContent = fmtTime(data.rise) || '— (no sale hoy)';
    document.getElementById('moonset').textContent = fmtTime(data.set) || '— (no se pone hoy)';

    document.getElementById('location-note').textContent = `Según tu ubicación: ${locationLabel}`;
  } catch (err) {
    document.getElementById('location-note').textContent = 'No se pudo calcular. Intenta de nuevo.';
    console.error(err);
  }
}

function initLocationAndLoad() {
  if (!navigator.geolocation) {
    loadToday(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, FALLBACK_COORDS.label);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => loadToday(pos.coords.latitude, pos.coords.longitude, 'tu ubicación actual'),
    () => loadToday(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, FALLBACK_COORDS.label),
    { enableHighAccuracy: false, timeout: 8000 }
  );
}

// ---------- Brújula ----------

function drawCompassTicks() {
  const g = document.getElementById('compass-ticks');
  if (g.childElementCount) return;
  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * 2 * Math.PI;
    const major = i % 18 === 0;
    const r1 = 148, r2 = major ? 132 : 140;
    const x1 = 160 + r1 * Math.sin(angle), y1 = 160 - r1 * Math.cos(angle);
    const x2 = 160 + r2 * Math.sin(angle), y2 = 160 - r2 * Math.cos(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'var(--accent-gold-dim)');
    line.setAttribute('stroke-width', major ? '1.5' : '1');
    line.setAttribute('opacity', major ? '0.8' : '0.4');
    g.appendChild(line);
  }
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
function cardinalFor(heading) {
  return CARDINALS[Math.round(heading / 45) % 8];
}

let lastMoonAzimuth = null;
let lastMoonAltitude = null;
let moonHorizonInterval = null;

function updateMoonHorizon() {
  try {
    const time = Astronomy.MakeTime(new Date());
    const observer = new Astronomy.Observer(currentLat, currentLon, 0);
    const eq = Astronomy.Equator(Astronomy.Body.Moon, time, observer, true, true);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    lastMoonAzimuth = hor.azimuth;
    lastMoonAltitude = hor.altitude;
    positionMoonMarker(currentHeading || 0);
  } catch (err) {
    console.error(err);
  }
}

function positionMoonMarker(heading) {
  if (lastMoonAzimuth === null) return;
  const relativeAngle = lastMoonAzimuth - heading;
  document.getElementById('moon-marker-group').setAttribute('transform', `translate(160,160) rotate(${relativeAngle})`);
  const altLabel = document.getElementById('moon-marker-alt');
  altLabel.textContent = `${lastMoonAltitude.toFixed(0)}°`;
  const marker = document.querySelector('.moon-marker-disc');
  const isVisible = lastMoonAltitude > 0;
  marker.style.opacity = isVisible ? '1' : '0.35';
  document.querySelector('.moon-marker-line').style.opacity = isVisible ? '0.7' : '0.25';
}

let currentHeading = 0;

function handleOrientation(event) {
  let heading;
  if (typeof event.webkitCompassHeading === 'number') {
    heading = event.webkitCompassHeading;
  } else if (event.absolute && event.alpha !== null) {
    heading = 360 - event.alpha;
  } else if (event.alpha !== null) {
    heading = 360 - event.alpha;
  }
  if (heading === undefined || Number.isNaN(heading)) return;
  currentHeading = heading;

  document.getElementById('needle-group').setAttribute('transform', `translate(160,160) rotate(${-heading})`);
  document.getElementById('heading-deg').textContent = `${Math.round(heading)}°`;
  document.getElementById('heading-cardinal').textContent = cardinalFor(heading);
  positionMoonMarker(heading);
}

async function activateCompass() {
  const note = document.getElementById('compass-note');
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result !== 'granted') {
        note.textContent = 'Permiso denegado. Actívalo en Ajustes > Safari > Ubicación y movimiento.';
        return;
      }
    } catch (err) {
      note.textContent = 'No se pudo pedir permiso de orientación.';
      return;
    }
  }
  window.addEventListener('deviceorientation', handleOrientation, true);
  updateMoonHorizon();
  if (moonHorizonInterval) clearInterval(moonHorizonInterval);
  moonHorizonInterval = setInterval(updateMoonHorizon, 60000);
  note.textContent = 'El punto dorado marca dónde está la Luna. Se atenúa si está bajo el horizonte.';
  document.getElementById('compass-btn').textContent = 'Brújula activada';
}

// ---------- Tabs ----------

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById(`view-${tab.dataset.view}`).classList.remove('hidden');
      if (tab.dataset.view === 'calendario') renderCalendar();
      if (tab.dataset.view !== 'brujula' && moonHorizonInterval) {
        clearInterval(moonHorizonInterval);
        moonHorizonInterval = null;
      }
    });
  });
}

// ---------- Calendario ----------

let calYear, calMonth; // month: 0-11
let calMode = 'fases';
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function miniMoonSvg(phaseAngleDeg) {
  const p = ((phaseAngleDeg % 360) + 360) % 360 / 360;
  const R = 40;
  const theta = p * 2 * Math.PI;
  const rx = Math.abs(R * Math.cos(theta));
  let sweep1, sweep2;
  if (p < 0.25)      { sweep1 = 1; sweep2 = 1; }
  else if (p < 0.5)   { sweep1 = 0; sweep2 = 1; }
  else if (p < 0.75)  { sweep1 = 1; sweep2 = 0; }
  else                { sweep1 = 0; sweep2 = 0; }
  const d = `M 0,${-R} A ${rx},${R} 0 0,${sweep1} 0,${R} A ${R},${R} 0 0,${sweep2} 0,${-R} Z`;
  return `<svg viewBox="-44 -44 88 88"><circle r="40" fill="var(--moon-shadow)"></circle><path d="${d}" fill="var(--moon-silver)"></path><circle r="40" fill="none" stroke="var(--accent-gold)" stroke-width="2" opacity="0.7"></circle></svg>`;
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Dom
  const gridStart = new Date(year, month, 1 - startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function findMonthEvents(year, month) {
  // Encuentra lunas nuevas y llenas dentro del rango visible del grid.
  const events = []; // {dateKey, label, timeStr}
  const rangeStart = Astronomy.MakeTime(new Date(year, month, 1, 0, 0, 0));
  const rangeEndDate = new Date(year, month + 1, 7); // margen
  [0, 180].forEach((targetLon) => {
    let t = rangeStart;
    for (let i = 0; i < 4; i++) {
      let found;
      try {
        found = Astronomy.SearchMoonPhase(targetLon, t, 40);
      } catch (e) { break; }
      if (!found || found.date > rangeEndDate) break;
      const dateKey = found.date.toDateString();
      events.push({
        dateKey,
        label: targetLon === 0 ? 'Luna Nueva' : 'Luna Llena',
        timeStr: found.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      });
      t = Astronomy.MakeTime(new Date(found.date.getTime() + 24 * 3600 * 1000));
    }
  });
  return events;
}

function renderCalendar() {
  const today = new Date();
  if (calYear === undefined) { calYear = today.getFullYear(); calMonth = today.getMonth(); }

  document.getElementById('cal-month-label').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  const cells = buildMonthGrid(calYear, calMonth);
  const events = findMonthEvents(calYear, calMonth);
  const eventsByDate = {};
  events.forEach(e => { eventsByDate[e.dateKey] = e; });

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  cells.forEach((d) => {
    const isOutside = d.getMonth() !== calMonth;
    const isToday = d.toDateString() === today.toDateString();
    const noon = new Date(d); noon.setHours(12, 0, 0, 0);
    const time = Astronomy.MakeTime(noon);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (isOutside ? ' outside' : '') + (isToday ? ' today' : '');

    const dayNum = document.createElement('span');
    dayNum.className = 'cal-day-num';
    dayNum.textContent = d.getDate();
    cell.appendChild(dayNum);

    if (calMode === 'fases') {
      const angle = Astronomy.MoonPhase(time);
      const wrap = document.createElement('div');
      wrap.innerHTML = miniMoonSvg(angle);
      cell.appendChild(wrap.firstChild);

      const ev = eventsByDate[d.toDateString()];
      if (ev) {
        cell.classList.add('event');
        const label = document.createElement('span');
        label.className = 'cal-event-time';
        label.textContent = ev.timeStr;
        cell.appendChild(label);
      }
    } else {
      const eclip = Astronomy.EclipticGeoMoon(time);
      const sign = getZodiacSign(eclip.lon);
      const symbol = document.createElement('span');
      symbol.className = 'cal-sign-symbol';
      symbol.textContent = sign.symbol;
      const abbr = document.createElement('span');
      abbr.className = 'cal-sign-abbr';
      abbr.textContent = sign.name.slice(0, 3);
      cell.appendChild(symbol);
      cell.appendChild(abbr);
    }

    grid.appendChild(cell);
  });
}

function initCalendarControls() {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  document.getElementById('cal-mode-fases').addEventListener('click', () => {
    calMode = 'fases';
    document.getElementById('cal-mode-fases').classList.add('active');
    document.getElementById('cal-mode-signos').classList.remove('active');
    renderCalendar();
  });
  document.getElementById('cal-mode-signos').addEventListener('click', () => {
    calMode = 'signos';
    document.getElementById('cal-mode-signos').classList.add('active');
    document.getElementById('cal-mode-fases').classList.remove('active');
    renderCalendar();
  });
}

// ---------- Init ----------

drawCompassTicks();
initTabs();
initCalendarControls();
initLocationAndLoad();
document.getElementById('compass-btn').addEventListener('click', activateCompass);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
