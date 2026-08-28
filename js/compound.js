/* Sección 2 — Simulador de interés compuesto. */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const MAX_N = 5000;

  let chart = null;
  let ultima = [];   // filas de la última simulación (para CSV)

  const DIAS = { diario: 1, semanal: 7, mensual: 30, operacion: 0 };

  function leerParams() {
    const p = {
      capital: Math.max(Number($('ci-capital').value) || 0, 0),
      pct: Number($('ci-pct').value) || 0,
      n: Math.min(Math.max(parseInt($('ci-n').value, 10) || 1, 1), MAX_N),
      frec: $('ci-frec').value,
      aporte: Number($('ci-aporte').value) || 0,
      reinvertir: $('ci-reinvertir').checked
    };
    $('ci-n').value = p.n;   // recorta si se pasó del máximo
    return p;
  }

  function fechaDe(i, frec) {
    const paso = DIAS[frec];
    if (!paso) return '—';                       // "por operación": sin calendario
    const d = new Date();
    d.setDate(d.getDate() + i * paso);
    const z = function (x) { return String(x).padStart(2, '0'); };
    return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* Devuelve las filas de la proyección y, en paralelo, la curva simple
     (ganancia siempre calculada sobre el capital inicial) para comparar. */
  function simular(p) {
    const filas = [];
    let capital = p.capital;
    let simple = p.capital;
    const gananciaFija = p.capital * (p.pct / 100);   // sin reinvertir

    for (let i = 1; i <= p.n; i++) {
      const inicio = capital;
      const ganancia = p.reinvertir ? inicio * (p.pct / 100) : gananciaFija;
      capital = inicio + ganancia + p.aporte;
      simple = simple + gananciaFija + p.aporte;

      filas.push({
        i: i,
        fecha: fechaDe(i, p.frec),
        inicio: inicio,
        ganancia: ganancia,
        fin: capital,
        simple: simple,
        pctAcum: p.capital !== 0 ? ((capital - p.capital) / p.capital) * 100 : 0
      });
    }
    return filas;
  }

  function pintarKPIs(p, filas) {
    const m = Store.get('moneda', 'EUR');
    const final = filas.length ? filas[filas.length - 1].fin : p.capital;
    const aportado = p.capital + p.aporte * p.n;
    const ganancia = final - aportado;
    const pct = aportado !== 0 ? (ganancia / aportado) * 100 : 0;

    $('ci-final').textContent = Fmt.money(final, m);

    const g = $('ci-ganancia');
    g.textContent = Fmt.money(ganancia, m);
    g.className = Fmt.signClass(ganancia);

    const c = $('ci-crecimiento');
    c.textContent = Fmt.pct(pct);
    c.className = Fmt.signClass(pct);
  }

  const MAX_FILAS_TABLA = 500;   // el CSV sí lleva todas

  function pintarTabla(filas) {
    const tbody = document.querySelector('#tabla-compuesto tbody');
    const m = Store.get('moneda', 'EUR');
    const frag = document.createDocumentFragment();
    const visibles = filas.slice(0, MAX_FILAS_TABLA);

    visibles.forEach(function (f) {
      const tr = document.createElement('tr');
      [
        [String(f.i), ''],
        [f.fecha, ''],
        [Fmt.money(f.inicio, m), ''],
        [Fmt.money(f.ganancia, m), Fmt.signClass(f.ganancia)],
        [Fmt.money(f.fin, m), ''],
        [Fmt.pct(f.pctAcum), Fmt.signClass(f.pctAcum)]
      ].forEach(function (par) {
        const td = document.createElement('td');
        td.textContent = par[0];
        if (par[1]) td.className = par[1];
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });

    if (filas.length > visibles.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.style.textAlign = 'center';
      td.className = 'hint';
      td.textContent = 'Mostrando los primeros ' + MAX_FILAS_TABLA + ' de ' + filas.length +
        ' períodos. Exporta a CSV para verlos todos.';
      tr.appendChild(td);
      frag.appendChild(tr);
    }

    tbody.innerHTML = '';
    tbody.appendChild(frag);
  }

  function pintarGrafico(p, filas) {
    if (!chart) chart = new LineChart($('chart-compuesto'));
    const m = Store.get('moneda', 'EUR');
    const labels = ['0'].concat(filas.map(function (f) {
      return f.fecha !== '—' ? f.fecha.slice(0, 5) : '#' + f.i;
    }));
    chart.render({
      labels: labels,
      format: function (v) { return Fmt.money(v, m); },
      series: [
        {
          name: 'Compuesto', color: '#3ce0ff', fill: true, baseline: p.capital,
          values: [p.capital].concat(filas.map(function (f) { return f.fin; }))
        },
        {
          name: 'Simple', color: '#ff7a45', dashed: true,
          values: [p.capital].concat(filas.map(function (f) { return f.simple; }))
        }
      ]
    });
  }

  function correr() {
    const p = leerParams();
    const filas = simular(p);
    ultima = filas;
    Store.set('compuesto', {
      capital: p.capital, pct: p.pct, n: p.n,
      frec: p.frec, aporte: p.aporte, reinvertir: p.reinvertir
    });
    pintarKPIs(p, filas);
    pintarTabla(filas);
    pintarGrafico(p, filas);
  }

  function exportar() {
    if (!ultima.length) { correr(); }
    exportCSV(
      'kronos-interes-compuesto.csv',
      ['#', 'Fecha', 'Capital inicio', 'Ganancia', 'Capital fin', '% acumulado', 'Capital simple'],
      ultima.map(function (f) {
        return [f.i, f.fecha, f.inicio.toFixed(2), f.ganancia.toFixed(2),
                f.fin.toFixed(2), f.pctAcum.toFixed(4), f.simple.toFixed(2)];
      })
    );
  }

  function sincronizarPct(desde) {
    const range = $('ci-pct-range'), num = $('ci-pct');
    if (desde === 'range') {
      num.value = range.value;
    } else {
      const v = Number(num.value) || 0;
      // el slider sólo cubre -5..10; fuera de ese rango se queda en el extremo
      range.value = Math.min(Math.max(v, Number(range.min)), Number(range.max));
    }
    $('ci-pct-out').textContent = Fmt.num(Number(num.value) || 0, 2) + '%';
  }

  function init() {
    const g = Store.get('compuesto', null);
    if (g) {
      $('ci-capital').value = g.capital;
      $('ci-pct').value = g.pct;
      $('ci-n').value = g.n;
      $('ci-frec').value = g.frec;
      $('ci-aporte').value = g.aporte;
      $('ci-reinvertir').checked = g.reinvertir !== false;
    } else {
      // arranca con el capital actual de la sección de crecimiento
      $('ci-capital').value = Store.get('inicial', 1000);
    }
    sincronizarPct('num');

    $('ci-pct-range').addEventListener('input', function () { sincronizarPct('range'); correr(); });
    $('ci-pct').addEventListener('input', function () { sincronizarPct('num'); correr(); });
    ['ci-capital', 'ci-n', 'ci-aporte'].forEach(function (id) {
      $(id).addEventListener('input', correr);
    });
    $('ci-frec').addEventListener('change', correr);
    $('ci-reinvertir').addEventListener('change', correr);
    $('ci-simular').addEventListener('click', correr);
    $('ci-export').addEventListener('click', exportar);

    correr();
  }

  window.Compound = { init: init, run: correr };
})();
