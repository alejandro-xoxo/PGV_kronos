/* Arranque y navegación por pestañas. */
(function () {
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  const paneles = {
    crecimiento: document.getElementById('tab-crecimiento'),
    compuesto: document.getElementById('tab-compuesto'),
    conversor: document.getElementById('tab-conversor')
  };

  function mostrar(nombre) {
    Object.keys(paneles).forEach(function (k) {
      paneles[k].classList.toggle('hidden', k !== nombre);
    });
    tabs.forEach(function (t) {
      const activo = t.dataset.tab === nombre;
      t.classList.toggle('is-active', activo);
      t.setAttribute('aria-selected', activo ? 'true' : 'false');
    });
    if (location.hash.slice(1) !== nombre) history.replaceState(null, '', '#' + nombre);
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { mostrar(t.dataset.tab); });
  });

  const inicial = location.hash.slice(1);
  mostrar(paneles[inicial] ? inicial : 'crecimiento');
})();
