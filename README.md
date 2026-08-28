# 🪐 Kronos — Panel de crecimiento de capital

Panel de control personal para seguimiento de capital de trading. Sitio **100 % estático**
(HTML + CSS + JavaScript puro), **sin build, sin npm y sin dependencias externas**:
listo para publicar en GitHub Pages tal cual.

## Contenido

| Sección | Qué hace |
|---|---|
| **Crecimiento** | Capital inicial + historial de registros (fecha, capital del día **o** % de ganancia/pérdida). Calcula Δ del período, % del período, % acumulado y crecimiento medio geométrico por registro. Gráfico de línea de la evolución. |
| **Interés compuesto** | Simulador: capital inicial, % por operación (campo + slider), nº de operaciones, frecuencia (diario/semanal/mensual/por operación), aporte por período y conmutador de reinversión. Tabla período a período y gráfico comparando la curva compuesta con la simple. |
| **Conversor** | Convierte COP, USD y cualquier otra moneda a EUR (y al revés) con tasas en vivo. Endpoint y API key configurables; tasas manuales como respaldo sin internet. |

Extras: **exportar a CSV** en las secciones de crecimiento e interés compuesto, **botón de reseteo**,
y persistencia automática en `localStorage` (los datos nunca salen de tu navegador).

## Diseño — tema galáctico / espacial

El sitio tiene un **tema visual de galaxia/espacio** documentado como parte del diseño:

- **Fondo animado de espacio profundo** dibujado sobre `<canvas>`: tres capas de estrellas
  con **efecto parallax** (cada capa se desplaza a distinta velocidad) y **parpadeo** individual.
- **Planetas decorativos**: uno estilo **Marte** (rojizo, semitransparente, arriba a la derecha,
  con cráteres sutiles y rotación muy lenta) y un segundo planeta azulado abajo a la izquierda,
  ambos con una leve animación de flotación.
- **Paleta oscura espacial**: negros y azules profundos, con acentos neón suaves —
  cian `#3ce0ff`, morado `#a06bff` y naranja marciano `#ff7a45` — en botones, bordes y gráficos.
- **Glassmorphism**: paneles y tarjetas con fondo semiopaco y `backdrop-filter: blur()` para que
  el contenido se lea con claridad por encima del fondo animado.
- Interfaz tipo dashboard, **en español** y **responsive** (móvil incluido).

### Rendimiento de la animación

- `requestAnimationFrame` en un único bucle, sin `setInterval`.
- Número de estrellas proporcional al área de la ventana y con **techo duro de 420**.
- `devicePixelRatio` limitado a 2× para no pintar píxeles de más.
- La animación se **pausa automáticamente** cuando la pestaña deja de estar visible
  (`visibilitychange`).
- Respeta `prefers-reduced-motion`: con esa preferencia activa, el fondo se pinta **estático**
  y los planetas no se animan.

## Estructura del proyecto

```
.
├── index.html          # una sola página con 3 pestañas
├── styles.css          # tema galáctico, glassmorphism, responsive
├── js/
│   ├── starfield.js    # fondo de estrellas con parallax (canvas)
│   ├── chart.js        # mini librería de gráficos de línea (canvas, sin CDN)
│   ├── storage.js      # localStorage, formatos es-ES y exportación CSV
│   ├── growth.js       # Sección 1 — crecimiento de capital
│   ├── compound.js     # Sección 2 — interés compuesto
│   ├── fx.js           # Sección 3 — conversor de monedas
│   └── app.js          # arranque y navegación por pestañas
└── README.md
```

## Uso local

No hace falta compilar nada. Abre `index.html` en el navegador, o levanta un servidor
estático para que `fetch` de las tasas funcione sin restricciones:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Tasas de cambio

Por defecto usa **[open.er-api.com](https://open.er-api.com)**, que **no requiere API key**:

```
https://open.er-api.com/v6/latest/EUR
```

En la pestaña *Conversor* puedes:

- **Cambiar el endpoint** por cualquier otra API que devuelva un objeto `rates`,
  `conversion_rates` o `data` (por ejemplo exchangerate-api.com o frankfurter.app).
  Si la base no es EUR, las tasas se reconvierten automáticamente a base EUR.
- **Configurar una API key**: escribe `{key}` en la URL donde deba insertarse; si no hay
  marcador, la key se añade como parámetro `?apikey=`.
- **Introducir tasas manualmente** (unidades por 1 EUR) como respaldo si la API falla o
  no hay internet. Las tasas manuales **tienen prioridad** sobre las de la API, y también
  sirven para **añadir monedas nuevas** que la API no cubra.

Las últimas tasas descargadas quedan cacheadas en `localStorage` y se refrescan
automáticamente si tienen más de 12 horas.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (público, o privado con GitHub Pro).
2. Sube el contenido de esta carpeta a la rama `main`:

   ```bash
   git init
   git add .
   git commit -m "Panel de capital Kronos"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```

3. En GitHub: **Settings → Pages**.
4. En *Build and deployment* → *Source*, elige **Deploy from a branch**.
5. En *Branch*, selecciona **`main`** y la carpeta **`/ (root)`**. Pulsa **Save**.
6. Espera 1–2 minutos. El sitio quedará publicado en:

   ```
   https://TU-USUARIO.github.io/TU-REPO/
   ```

Como `index.html` está en la raíz y no hay carpetas que empiecen por `_`, no hace falta
ni configuración de Jekyll ni archivo `.nojekyll`.

## Notas

- Todos los datos se guardan **solo en tu navegador** (`localStorage`, prefijo `kronos.v1.`).
  Borrar los datos del sitio o usar otro navegador/dispositivo implica empezar de cero;
  usa el botón *Exportar CSV* para llevarte una copia.
- La única petición de red que hace el sitio es la consulta de tasas de cambio.
- El selector de moneda de la sección *Crecimiento* afecta **solo al formato de visualización**:
  no convierte las cifras que ya introdujiste.
