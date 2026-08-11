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
    document.getElementById('location-note').textContent = `Error: ${err.message || err}`;
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

  document.getElementById('needle-group').setAttribute('transform', `translate(160,160) rotate(${-heading})`);
  document.getElementById('heading-deg').textContent = `${Math.round(heading)}°`;
  document.getElementById('heading-cardinal').textContent = cardinalFor(heading);
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
  note.textContent = 'Brújula activa. Aléjate de imanes o metal para mayor precisión.';
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
    });
  });
}

// ---------- Init ----------

drawCompassTicks();
initTabs();
initLocationAndLoad();
document.getElementById('compass-btn').addEventListener('click', activateCompass);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
