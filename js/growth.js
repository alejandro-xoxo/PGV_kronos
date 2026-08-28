/* Sección 1 — Crecimiento porcentual del capital.
   Los registros se guardan como {id, fecha, tipo, valor, nota} y la cadena de
   capitales se recalcula al vuelo, de modo que cambiar el capital inicial
   reajusta correctamente los registros introducidos como porcentaje. */
(function () {
  const $ = function (id) { return document.getElementById(id); };

  const state = {
    inicial: Store.get('inicial', 1000),
    moneda: Store.get('moneda', 'EUR'),
    registros: Store.get('registros', [])   // [{id, fecha, tipo:'capital'|'pct', valor, nota}]
  };

  let chart = null;

  function guardar() {
    Store.set('inicial', state.inicial);
    Store.set('moneda', state.moneda);
    Store.set('registros', state.registros);
  }

  /* Ordena por fecha y calcula capital, delta y porcentajes de cada fila. */
  function calcular() {
    const base = Number(state.inicial) || 0;
    const orden = state.registros.slice().sort(function (a, b) {
      if (a.fecha === b.fecha) return a.id - b.id;
      return a.fecha < b.fecha ? -1 : 1;
    });

    let prev = base;
    return orden.map(function (r) {
      const capital = r.tipo === 'pct'
        ? prev * (1 + (Number(r.valor) || 0) / 100)
        : (Number(r.valor) || 0);
      const delta = capital - prev;
      const pctPeriodo = prev !== 0 ? (delta / prev) * 100 : 0;
      const pctAcum = base !== 0 ? ((capital - base) / base) * 100 : 0;
      prev = capital;
      return {
        id: r.id, fecha: r.fecha, nota: r.nota || '',
        capital: capital, delta: delta, pctPeriodo: pctPeriodo, pctAcum: pctAcum
      };
    });
  }

  function pintarKPIs(filas) {
    const base = Number(state.inicial) || 0;
    const m = state.moneda;
    const ultimo = filas.length ? filas[filas.length - 1] : null;
    const actual = ultimo ? ultimo.capital : base;
    const ganancia = actual - base;
    const pct = base !== 0 ? (ganancia / base) * 100 : 0;

    $('k-inicial').textContent = Fmt.money(base, m);
    $('k-actual').textContent = Fmt.money(actual, m);

    const g = $('k-ganancia');
    g.textContent = Fmt.money(ganancia, m);
    g.className = Fmt.signClass(ganancia);

    const p = $('k-pct');
    p.textContent = Fmt.pct(pct);
    p.className = Fmt.signClass(pct);

    const u = $('k-ultimo');
    u.textContent = ultimo ? Fmt.pct(ultimo.pctPeriodo) : '—';
    u.className = ultimo ? Fmt.signClass(ultimo.pctPeriodo) : '';

    // media geométrica por registro: (1+r)^(1/n) - 1
    const med = $('k-media');
    if (filas.length && base > 0 && actual > 0) {
      const g2 = (Math.pow(actual / base, 1 / filas.length) - 1) * 100;
      med.textContent = Fmt.pct(g2);
      med.className = Fmt.signClass(g2);
    } else {
      med.textContent = '—';
      med.className = '';
    }
  }

  function pintarTabla(filas) {
    const tbody = document.querySelector('#tabla-crecimiento tbody');
    const vacio = $('empty-crecimiento');
    tbody.innerHTML = '';
    vacio.style.display = filas.length ? 'none' : 'block';

    const m = state.moneda;
    filas.forEach(function (f) {
      const tr = document.createElement('tr');

      const c = function (txt, cls) {
        const td = document.createElement('td');
        td.textContent = txt;
        if (cls) td.className = cls;
        tr.appendChild(td);
      };

      c(Fmt.fecha(f.fecha));
      c(Fmt.money(f.capital, m));
      c(Fmt.money(f.delta, m), Fmt.signClass(f.delta));
      c(Fmt.pct(f.pctPeriodo), Fmt.signClass(f.pctPeriodo));
      c(Fmt.pct(f.pctAcum), Fmt.signClass(f.pctAcum));
      c(f.nota);

      const tdDel = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'del';
      btn.type = 'button';
      btn.textContent = '×';
      btn.title = 'Eliminar registro';
      btn.setAttribute('aria-label', 'Eliminar registro del ' + Fmt.fecha(f.fecha));
      btn.addEventListener('click', function () { eliminar(f.id); });
      tdDel.appendChild(btn);
      tr.appendChild(tdDel);

      tbody.appendChild(tr);
    });
  }

  function pintarGrafico(filas) {
    if (!chart) chart = new LineChart($('chart-crecimiento'));
    const base = Number(state.inicial) || 0;
    const m = state.moneda;
    chart.render({
      labels: ['Inicio'].concat(filas.map(function (f) { return Fmt.fechaCorta(f.fecha); })),
      format: function (v) { return Fmt.money(v, m); },
      series: [{
        name: 'Capital',
        color: '#3ce0ff',
        fill: true,
        baseline: base,
        values: [base].concat(filas.map(function (f) { return f.capital; }))
      }]
    });
  }

  function render() {
    const filas = calcular();
    pintarKPIs(filas);
    pintarTabla(filas);
    pintarGrafico(filas);
    return filas;
  }

  function eliminar(id) {
    state.registros = state.registros.filter(function (r) { return r.id !== id; });
    guardar();
    render();
  }

  function agregar() {
    const fecha = $('reg-fecha').value || hoyISO();
    const tipo = $('reg-tipo').value;
    const valorRaw = $('reg-valor').value;
    const msg = $('msg-crecimiento');

    if (valorRaw === '' || !isFinite(Number(valorRaw))) {
      flash(msg, 'Introduce un valor numérico válido.', 'error');
      return;
    }
    const valor = Number(valorRaw);
    if (tipo === 'capital' && valor < 0) {
      flash(msg, 'El capital del día no puede ser negativo.', 'error');
      return;
    }

    state.registros.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      fecha: fecha,
      tipo: tipo,
      valor: valor,
      nota: $('reg-nota').value.trim()
    });
    guardar();
    render();

    $('reg-valor').value = '';
    $('reg-nota').value = '';
    flash(msg, 'Registro agregado.', 'ok');
  }

  function exportar() {
    const filas = calcular();
    if (!filas.length) {
      flash($('msg-crecimiento'), 'No hay registros que exportar.', 'error');
      return;
    }
    exportCSV(
      'kronos-crecimiento.csv',
      ['Fecha', 'Capital', 'Delta periodo', '% periodo', '% acumulado', 'Nota'],
      filas.map(function (f) {
        return [f.fecha, f.capital.toFixed(2), f.delta.toFixed(2),
                f.pctPeriodo.toFixed(4), f.pctAcum.toFixed(4), f.nota];
      })
    );
  }

  function resetear() {
    if (!confirm('¿Borrar el capital inicial y todos los registros de crecimiento? Esta acción no se puede deshacer.')) return;
    state.registros = [];
    state.inicial = 1000;
    Store.remove('registros');
    Store.remove('inicial');
    $('capital-inicial').value = state.inicial;
    render();
    flash($('msg-crecimiento'), 'Datos reseteados.', 'ok');
  }

  function actualizarEtiquetaValor() {
    const tipo = $('reg-tipo').value;
    $('reg-valor-label').textContent = tipo === 'pct' ? '% ganancia/pérdida del día' : 'Capital del día';
    $('reg-valor').placeholder = tipo === 'pct' ? '1.5' : '1010';
  }

  function init() {
    $('capital-inicial').value = state.inicial;
    $('moneda-display').value = state.moneda;
    $('reg-fecha').value = hoyISO();
    actualizarEtiquetaValor();

    $('capital-inicial').addEventListener('input', function () {
      state.inicial = Number(this.value) || 0;
      guardar();
      render();
    });
    $('moneda-display').addEventListener('change', function () {
      state.moneda = this.value;
      guardar();
      render();
    });
    $('reg-tipo').addEventListener('change', actualizarEtiquetaValor);
    $('reg-valor').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') agregar();
    });
    $('btn-add').addEventListener('click', agregar);
    $('btn-export').addEventListener('click', exportar);
    $('btn-reset').addEventListener('click', resetear);

    render();
  }

  window.Growth = { init: init, render: render };
})();
