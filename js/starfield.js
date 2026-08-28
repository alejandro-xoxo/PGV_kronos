/* Fondo de estrellas con parallax (3 capas) sobre canvas.
   Rendimiento: densidad limitada por área, requestAnimationFrame,
   se pausa si la pestaña no está visible y respeta prefers-reduced-motion. */
(function () {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Capas: la más lejana es pequeña, tenue y lenta.
  const LAYERS = [
    { speed: 0.008, size: [0.5, 1.0], alpha: [0.20, 0.45], density: 1 / 14000, tint: '210,225,255' },
    { speed: 0.020, size: [0.8, 1.6], alpha: [0.30, 0.65], density: 1 / 22000, tint: '150,220,255' },
    { speed: 0.045, size: [1.2, 2.3], alpha: [0.40, 0.90], density: 1 / 45000, tint: '200,180,255' }
  ];
  const MAX_STARS = 420;   // techo duro para no castigar la batería
  let stars = [];
  let w = 0, h = 0, dpr = 1;
  let rafId = null, last = 0, running = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    const area = w * h;
    stars = [];
    let budget = MAX_STARS;
    LAYERS.forEach(function (L) {
      const n = Math.min(Math.round(area * L.density), budget);
      budget -= n;
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(L.size[0], L.size[1]),
          a: rand(L.alpha[0], L.alpha[1]),
          base: 0,
          speed: L.speed,
          tint: L.tint,
          // parpadeo: fase y frecuencia propias
          ph: Math.random() * Math.PI * 2,
          fq: rand(0.4, 1.6)
        });
      }
    });
    stars.forEach(function (s) { s.base = s.a; });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR: menos píxeles que pintar
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) draw(0); // pintado estático
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * s.fq + s.ph);
      ctx.globalAlpha = s.base * tw;
      ctx.fillStyle = 'rgb(' + s.tint + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step(now) {
    const dt = Math.min(now - last, 50); // evita saltos tras pausas largas
    last = now;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.speed * dt;           // deriva horizontal lenta
      if (s.x < -3) { s.x = w + 3; s.y = Math.random() * h; }
    }
    draw(now);
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  let rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  });
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  resize();
  start();
})();
