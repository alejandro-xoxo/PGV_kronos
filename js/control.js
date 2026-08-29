/* Panel de control — DEMO.
 * Réplica visual del dashboard operativo real de Kronos_Bot (posiciones
 * abiertas, botones BE/Cerrar, perfil de cuenta), pero sin backend: todos
 * los datos son generados en el navegador, no hay conexión a ninguna cuenta
 * real. Sirve como muestra de portafolio de la funcionalidad real.
 */
var ControlPanel = (function () {
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var tickTimer = null;
  var activeProfile = 'DEMO_VIP';

  var positions = [
    { id: 1, instrument: 'XAUUSD', direction: 'BUY', ticket: 88213045, entry: 4382.40, sl: 4360.00, tp: 4410.00, lot: 0.03, price: 4391.72 },
    { id: 2, instrument: 'EURUSD', direction: 'SELL', ticket: 88213112, entry: 1.16820, sl: 1.17050, tp: 1.16400, lot: 0.05, price: 1.16705 },
    { id: 3, instrument: 'GBPUSD', direction: 'BUY', ticket: 88213198, entry: 1.34210, sl: 1.33900, tp: 1.34700, lot: 0.02, price: 1.34390 }
  ];

  function pipValue(instrument) {
    // Aproximación simplificada solo para la demo visual, no para trading real.
    if (instrument === 'XAUUSD') return 1;
    return 10000;
  }

  function profit(pos) {
    var diff = pos.direction === 'BUY' ? (pos.price - pos.entry) : (pos.entry - pos.price);
    var pv = pipValue(pos.instrument);
    var pips = pos.instrument === 'XAUUSD' ? diff : diff * pv;
    var perLot = pos.instrument === 'XAUUSD' ? 100 : 10;
    return Number((pips * perLot * pos.lot).toFixed(2));
  }

  function step(pos) {
    var vola = pos.instrument === 'XAUUSD' ? 0.35 : 0.00025;
    pos.price = Number((pos.price + (Math.random() - 0.5) * vola).toFixed(pos.instrument === 'XAUUSD' ? 2 : 5));
  }

  function priceDecimals(instrument) {
    return instrument === 'XAUUSD' ? 2 : 5;
  }

  function render() {
    var body = document.getElementById('control-positions');
    var empty = document.getElementById('control-empty');
    var count = document.getElementById('control-count');
    if (!body) return;

    count.textContent = positions.length + (positions.length === 1 ? ' posición' : ' posiciones');
    empty.style.display = positions.length ? 'none' : '';
    body.innerHTML = '';

    var balance = 1000;
    var floating = 0;

    positions.forEach(function (pos) {
      var p = profit(pos);
      floating += p;
      var isProfit = p >= 0;
      var card = document.createElement('div');
      card.className = 'ctrl-card ' + (isProfit ? 'is-profit' : 'is-loss');
      card.innerHTML =
        '<div class="ctrl-top">' +
          '<div class="ctrl-instrument">' +
            '<span class="ctrl-symbol">' + pos.instrument + '</span>' +
            '<span class="ctrl-dir ' + (pos.direction === 'BUY' ? 'dir-buy' : 'dir-sell') + '">' + pos.direction + '</span>' +
          '</div>' +
          '<div class="ctrl-profit-block">' +
            '<div class="ctrl-profit ' + (isProfit ? 'pos' : 'neg') + '">' + (isProfit ? '+' : '') + money.format(p) + '</div>' +
            '<div class="ctrl-ticket">#' + pos.ticket + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ctrl-meta">' +
          '<div class="ctrl-meta-item"><span>Entrada</span><strong>' + pos.entry.toFixed(priceDecimals(pos.instrument)) + '</strong></div>' +
          '<div class="ctrl-meta-item"><span>Actual</span><strong>' + pos.price.toFixed(priceDecimals(pos.instrument)) + '</strong></div>' +
          '<div class="ctrl-meta-item"><span>SL</span><strong class="neg">' + pos.sl.toFixed(priceDecimals(pos.instrument)) + '</strong></div>' +
          '<div class="ctrl-meta-item"><span>TP</span><strong class="pos">' + pos.tp.toFixed(priceDecimals(pos.instrument)) + '</strong></div>' +
        '</div>' +
        '<div class="ctrl-actions">' +
          '<button class="btn ctrl-act" data-action="be" data-id="' + pos.id + '">Mover a BE</button>' +
          '<button class="btn btn--danger ctrl-act" data-action="close" data-id="' + pos.id + '">Cerrar</button>' +
        '</div>' +
        '<p class="ctrl-status" id="ctrl-status-' + pos.id + '"></p>';
      body.appendChild(card);
    });

    document.getElementById('control-balance').textContent = money.format(balance);
    document.getElementById('control-equity').textContent = money.format(balance + floating);
    var floatEl = document.getElementById('control-floating');
    floatEl.textContent = (floating >= 0 ? '+' : '') + money.format(floating);
    floatEl.className = floating >= 0 ? 'pos' : 'neg';
  }

  function handleAction(e) {
    var btn = e.target.closest('.ctrl-act');
    if (!btn) return;
    var id = Number(btn.dataset.id);
    var action = btn.dataset.action;
    var pos = positions.find(function (p) { return p.id === id; });
    if (!pos) return;
    var status = document.getElementById('ctrl-status-' + id);

    if (action === 'be') {
      pos.sl = pos.entry;
      if (status) status.textContent = 'SL movido a break-even (simulado, sin conexión real a MT4).';
      render();
    } else if (action === 'close') {
      positions = positions.filter(function (p) { return p.id !== id; });
      render();
    }
  }

  function initSegmented() {
    var wrap = document.getElementById('control-segmented');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      activeProfile = btn.dataset.profile;
      Array.prototype.forEach.call(wrap.querySelectorAll('.segmented__btn'), function (b) {
        b.classList.toggle('is-active', b === btn);
      });
    });
  }

  function startTicking() {
    if (tickTimer) return;
    tickTimer = setInterval(function () {
      positions.forEach(step);
      var panel = document.getElementById('tab-control');
      if (panel && !panel.classList.contains('hidden')) render();
    }, 2500);
  }

  function init() {
    initSegmented();
    document.getElementById('control-positions').addEventListener('click', handleAction);
    startTicking();
  }

  return { init: init, render: render };
})();
