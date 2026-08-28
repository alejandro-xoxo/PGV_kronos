# 🪐 Kronos — Panel de crecimiento de capital

Panel de control personal para seguimiento de capital de trading, con contador de días
del plan y lógica de **días operables**. Sitio **100 % estático** (HTML + CSS + JavaScript puro),
**sin build, sin npm y sin dependencias externas**: listo para publicar en GitHub Pages tal cual.

## Contenido

| Sección | Qué hace |
|---|---|
| **Crecimiento** | Fecha de inicio + capital inicial. Muestra en grande **en qué día del plan estás** y distingue días calendario transcurridos, días operables, días no operables y días aún sin registrar. Historial por fecha (capital del día **o** % de ganancia/pérdida), cada registro marcado como operable o no. Calcula Δ y % del período, % acumulado y crecimiento medio **tanto por día calendario como por día operable**. Gráfico de línea que diferencia visualmente los días operados de los no operados. |
| **Interés compuesto** | Simula día a día sobre el calendario: capital inicial, % por **día operable**, días de calendario a proyectar, fecha de inicio, selector de días operables de la semana (lun–dom) y lista de fechas no operables. Tabla día por día y gráfico con los tramos planos de los días no operables. Resumen con capital proyectado, ganancia, % total y **días operables reales vs días calendario**. |
| **Conversor** | Convierte COP, USD y cualquier otra moneda a EUR (y al revés) con tasas en vivo. Endpoint y API key configurables; tasas manuales como respaldo sin internet. |

Extras: **exportar a CSV** en ambas secciones (**incluyendo la columna de si el día fue operable**),
**botón de reseteo**, y persistencia automática en `localStorage` (los datos nunca salen de tu navegador).

---

## Lógica de días operables vs no operables

Es el concepto central del panel: **el capital sólo se mueve los días en que se opera.**
Un plan de "4 % diario" no es 4 % los 30 días del mes, sino 4 % los ~21 días hábiles;
mezclar ambas cosas infla la proyección de forma poco realista. Por eso Kronos separa
siempre las dos cuentas.

### Definiciones

- **Día calendario**: cada día que pasa desde la fecha de inicio, sin excepción.
- **Día operable**: un día en el que efectivamente se opera y el capital puede crecer o caer.
- **Día no operable**: fin de semana, feriado o cualquier día en que decides no operar.
  El capital **se mantiene exactamente igual**: no crece ni decrece.

### En la sección *Crecimiento* (datos reales)

- Cada registro que agregas lleva una casilla **"Día operable"**. Al elegir la fecha, la casilla
  se **presugiere automáticamente**: se desmarca si cae en sábado o domingo. Siempre puedes
  cambiarla a mano (por ejemplo, un feriado entre semana o un lunes que no operaste).
- Los días no operables aparecen en el historial **atenuados y con una marca lateral**, y en
  el gráfico con un **punto gris** en lugar de cian, de modo que las mesetas planas del fin de
  semana se ven de un vistazo.
- La banda superior muestra cuatro contadores: días calendario transcurridos, días operables
  registrados, días no operables registrados y **días sin registrar** (días del calendario ya
  transcurridos para los que aún no has cargado nada).
- Se calculan **dos medias geométricas** distintas sobre el mismo crecimiento acumulado:
  - **Media / día calendario** — `(capital_final / capital_inicial)^(1/días_calendario) − 1`
  - **Media / día operable** — `(capital_final / capital_inicial)^(1/días_operables) − 1`

  La segunda es tu rendimiento real por sesión de trabajo; la primera es lo que rinde tu
  capital en el tiempo natural. Con un plan de 4 % de lunes a viernes, la media por día
  operable sale exactamente **+4,000 %** y la de calendario, alrededor de **+3,26 %**.

### En la sección *Interés compuesto* (proyección)

- La simulación **avanza día por día en el calendario** a partir de la fecha de inicio, durante
  el número de días de calendario que indiques.
- Un día se considera operable si **su día de la semana está activado** (checkboxes lun–dom,
  por defecto lunes a viernes) **y su fecha no figura** en la lista de fechas no operables.
- El porcentaje se aplica **únicamente** en los días operables, reinvirtiendo el resultado
  (interés compuesto). En los días no operables el capital pasa intacto al día siguiente.
- El gráfico marca los días no operables con un punto gris, que es donde la curva se aplana;
  la línea naranja punteada es la misma proyección **sin reinvertir**, para comparar.
- El resumen indica siempre **cuántos días operables reales hubo frente a los días calendario
  totales** del rango elegido.

**Ejemplo**: 1.000 € al 4 % por día operable, 30 días de calendario desde un viernes, operando
de lunes a viernes → 21 días operables → **2.278,77 €** (`1000 × 1,04²¹`), +127,88 %.
Añadiendo dos feriados el martes y miércoles siguientes → 19 días operables → **2.106,85 €**.
Los 9 (u 11) días restantes existen en la tabla y en el gráfico, pero con capital plano.

### Formato de la lista de fechas no operables

Fechas en formato `AAAA-MM-DD`, separadas por saltos de línea, comas, puntos y coma o espacios.
Lo que no encaje con ese formato se ignora sin romper la simulación:

```
2026-09-15
2026-10-12, 2026-12-25
```

---

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
│   ├── storage.js      # localStorage, formatos es-ES, utilidades de calendario y CSV
│   ├── growth.js       # Sección 1 — crecimiento y contador de días del plan
│   ├── compound.js     # Sección 2 — interés compuesto por días operables
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
- Las fechas se manejan como cadenas `AAAA-MM-DD` y se construyen en hora **local**, para
  evitar el desfase de zona horaria que produce interpretar esas cadenas como UTC.
- La única petición de red que hace el sitio es la consulta de tasas de cambio.
- El selector de moneda de la sección *Crecimiento* afecta **solo al formato de visualización**:
  no convierte las cifras que ya introdujiste.
- La tabla del simulador muestra como máximo 500 filas por rendimiento; el CSV exporta todas.
