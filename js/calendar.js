/* Sección — Calendario de Trader
   Muestra un calendario mensual con la ganancia/pérdida de cada día,
   coloreando en verde los días positivos, rojo los negativos y gris
   los no operables. El total del mes aparece arriba a la derecha.
   Consume los mismos registros que Growth (Store 'registros' + 'inicial'). */
(function () {
  const $ = function (id) { return document.getElementById(id); };

  /* Año y mes que se están visualizando */
  let mesActual = (function () {
    const h = new Date();
    return { y: h.getFullYear(), m: h.getMonth() + 1 };
  }());

  /* Construye un mapa  'YYYY-MM-DD' → {delta, capital, operable, nota}
     a partir de los registros de crecimiento. */
  function buildMap() {
    const registros = Store.get('registros', []);
    const base = Number(Store.get('inicial', 1000)) || 0;

    const orden = registros.slice().sort(function (a, b) {
      return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0;
    });

    const mapa = {};
    let prev = base;
    orden.forEach(function (r) {
      const capital = r.tipo === 'pct'
        ? prev * (1 + (Number(r.valor) || 0) / 100)
        : (Number(r.valor) || 0);
      const delta = capital - prev;
      mapa[r.fecha] = {
        delta: delta,
        capital: capital,
        operable: r.operable !== false,
        nota: r.nota || '',
        pct: prev !== 0 ? (delta / prev) * 100 : 0
      };
      prev = capital;
    });
    return mapa;
  }

  /* Devuelve los días del mes como array de objetos {iso, dow} */
  function diasDelMes(y, m) {
    const dias = [];
    const total = new Date(y, m, 0).getDate(); // último día del mes
    const pad = function (n) { return String(n).padStart(2, '0'); };
    for (let d = 1; d <= total; d++) {
      const iso = y + '-' + pad(m) + '-' + pad(d);
      dias.push({ iso: iso, dow: Cal.diaSemana(iso), dia: d });
    }
    return dias;
  }

  /* Formatea delta para la celda (compacto) */
  function fmtDelta(v, moneda) {
    if (v == null || !isFinite(v)) return '';
    const sign = v >= 0 ? '+' : '';
    const abs = Math.abs(v);
    // compacto: K para miles
    let str;
    if (abs >= 10000) str = sign + (v / 1000).toFixed(1) + 'K';
    else if (abs >= 1000) str = sign + (v / 1000).toFixed(2) + 'K';
    else str = sign + v.toFixed(2);
    return str;
  }

  /* Dibuja el calendario del mes en curso */
  function render() {
    const { y, m } = mesActual;
    const moneda = Store.get('moneda', 'EUR');
    const mapa = buildMap();
    const dias = diasDelMes(y, m);
    const hoy = hoyISO();
    const NomMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    /* ── Cabecera: mes + navegación ── */
    $('cal-titulo').textContent = NomMes[m - 1] + ' ' + y;

    /* ── KPIs del mes ── */
    let totalDelta = 0, diasOp = 0, mejorDelta = null, peorDelta = null;
    dias.forEach(function (d) {
      const reg = mapa[d.iso];
      if (!reg || !reg.operable) return;
      totalDelta += reg.delta;
      diasOp++;
      if (mejorDelta === null || reg.delta > mejorDelta) mejorDelta = reg.delta;
      if (peorDelta === null || reg.delta < peorDelta) peorDelta = reg.delta;
    });

    const elTotal = $('cal-total');
    elTotal.textContent = Fmt.money(totalDelta, moneda);
    elTotal.className = 'cal-kpi__val ' + Fmt.signClass(totalDelta);

    $('cal-dias-op').textContent = diasOp;
    $('cal-mejor').textContent = mejorDelta !== null ? Fmt.money(mejorDelta, moneda) : '—';
    $('cal-mejor').className = mejorDelta !== null ? 'cal-kpi__val pos' : 'cal-kpi__val';
    $('cal-peor').textContent = peorDelta !== null ? Fmt.money(peorDelta, moneda) : '—';
    $('cal-peor').className = peorDelta !== null ? 'cal-kpi__val neg' : 'cal-kpi__val';

    /* ── Cuadrícula ── */
    const grid = $('cal-grid');
    grid.innerHTML = '';

    /* Celdas vacías hasta el primer día de la semana */
    const inicioSemana = dias[0].dow; // lun=0
    for (let i = 0; i < inicioSemana; i++) {
      const vacio = document.createElement('div');
      vacio.className = 'cal-cell cal-cell--empty';
      grid.appendChild(vacio);
    }

    /* Celdas de días */
    dias.forEach(function (d) {
      const reg = mapa[d.iso];
      const esFuturo = d.iso > hoy;
      const esHoy = d.iso === hoy;

      const cell = document.createElement('div');
      let cls = 'cal-cell';
      if (esHoy) cls += ' cal-cell--hoy';
      if (esFuturo) cls += ' cal-cell--futuro';

      if (reg) {
        if (reg.operable) {
          cls += reg.delta >= 0 ? ' cal-cell--pos' : ' cal-cell--neg';
        } else {
          cls += ' cal-cell--noop';
        }
      } else if (!esFuturo) {
        cls += ' cal-cell--sin-dato';
      }

      cell.className = cls;

      /* Número del día */
      const numEl = document.createElement('span');
      numEl.className = 'cal-cell__num';
      numEl.textContent = d.dia;
      cell.appendChild(numEl);

      /* Nombre del día (solo en la primera fila en móvil ya se ve en cabecera) */

      /* Delta / estado */
      if (reg) {
        if (reg.operable) {
          const deltaEl = document.createElement('span');
          deltaEl.className = 'cal-cell__delta';
          deltaEl.textContent = fmtDelta(reg.delta, moneda);
          cell.appendChild(deltaEl);

          const pctEl = document.createElement('span');
          pctEl.className = 'cal-cell__pct';
          pctEl.textContent = (reg.pct >= 0 ? '+' : '') + reg.pct.toFixed(2) + '%';
          cell.appendChild(pctEl);

          if (reg.nota) {
            const notaEl = document.createElement('span');
            notaEl.className = 'cal-cell__nota';
            notaEl.textContent = reg.nota;
            cell.appendChild(notaEl);
          }
        } else {
          const stEl = document.createElement('span');
          stEl.className = 'cal-cell__noop-label';
          stEl.textContent = 'No operable';
          cell.appendChild(stEl);
        }
      }

      grid.appendChild(cell);
    });
  }

  function prevMes() {
    mesActual.m--;
    if (mesActual.m < 1) { mesActual.m = 12; mesActual.y--; }
    render();
  }
  function nextMes() {
    mesActual.m++;
    if (mesActual.m > 12) { mesActual.m = 1; mesActual.y++; }
    render();
  }
  function irHoy() {
    const h = new Date();
    mesActual = { y: h.getFullYear(), m: h.getMonth() + 1 };
    render();
  }

  function init() {
    $('cal-prev').addEventListener('click', prevMes);
    $('cal-next').addEventListener('click', nextMes);
    $('cal-hoy').addEventListener('click', irHoy);
    render();
  }

  window.CalTrader = { init: init, render: render };
})();
