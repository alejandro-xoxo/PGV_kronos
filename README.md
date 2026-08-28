# 🪐 Kronos — Panel de crecimiento de capital

Panel de control personal para seguimiento de capital de trading. Sitio **100 % estático**
(HTML + CSS + JavaScript puro), **sin build, sin npm y sin dependencias externas**:
listo para publicar en GitHub Pages tal cual.

Una sola página con tres pestañas: **Crecimiento**, **Interés compuesto** y **Conversor**.

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
│   └── app.js          # arranque y navegación por pestañas
└── README.md
```

## Uso local

No hace falta compilar nada. Abre `index.html` en el navegador, o levanta un servidor estático:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la rama `main`.
2. En GitHub: **Settings → Pages**.
3. En *Build and deployment* → *Source*, elige **Deploy from a branch**.
4. En *Branch*, selecciona **`main`** y la carpeta **`/ (root)`**. Pulsa **Save**.
5. Espera 1–2 minutos. El sitio quedará en `https://TU-USUARIO.github.io/TU-REPO/`.
