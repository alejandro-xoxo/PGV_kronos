# 🗺️ Hoja de Ruta e Integración con Kronos_Bot

Documento de diseño y arquitectura para la integración entre **PVG_kronos** (Panel Frontend) y **Kronos_Bot** (Backend/Motor de Ejecución).

**Nota de origen**: `PVG_kronos` es una herramienta externa e independiente,
desarrollada sin relación con ningún bot en particular — no nació como parte de
`Kronos_Bot`. Este documento describe su **integración posterior** como
herramienta complementaria que se le adiciona al proyecto `Kronos_Bot`, no un
plan de diseño conjunto desde el origen de ambos.

---

## 🎯 Objetivo

Reemplazar la interfaz básica del dashboard de `Kronos_Bot` por esta interfaz galáctica (`PVG_kronos`, herramienta externa adicionada al proyecto) y conectar los datos en tiempo real mediante PostgreSQL y FastAPI/Flask, permitiendo sincronización multi-dispositivo vía Ngrok con autenticación segura.

---

## 🔗 Proyecto Relacionado

- **[Kronos_Bot (GitHub)](https://github.com/alejandro-xoxo/Kronos_Bot.git)** — Bot de ejecución automática de señales de Telegram a MT4 con backend en Python/Flask, n8n, PostgreSQL, Caddy y Ngrok.

---

## 📐 Arquitectura de Fusión Planificada

```
[ Celular / PC remoto ]
          │ (HTTPS vía Ngrok + HTTP Basic Auth)
          ▼
   [ Proxy Caddy / Docker ] ── (Puerto 8088)
          │
          ▼
   [ Kronos_Bot Backend (Flask) ]
          │
   ┌──────┴─────────────────────────┐
   ▼                                ▼
[ PostgreSQL (Base de datos) ]   [ MT4 Bridge (status.json) ]
```

---

## 🛠️ Pasos de Implementación Futura

1. **Reemplazo del Frontend (`Kronos_Bot/dashboard/static`)**:
   - Copiar los recursos de `PVG_kronos` (`index.html`, `styles.css`, `assets/`, `js/`) al directorio `/dashboard/static` de `Kronos_Bot`.

2. **Adaptación de Persistencia Híbrida en `storage.js`**:
   - Configurar `storage.js` para detectar si existe un backend activo en `/api/registros`.
   - Si la API responde, sincronizar `GET` y `POST` con PostgreSQL; si no (ej. al visualizar la demo en GitHub Pages), mantener `localStorage` como respaldo local.

3. **Endpoints a exponer en `Kronos_Bot/dashboard/main.py`**:
   - `GET /api/registros`: Retorna el historial de operaciones desde PostgreSQL.
   - `POST /api/registros`: Guarda un nuevo registro operado.
   - `GET /api/status`: Provee las posiciones abiertas reales directamente leídas desde MetaTrader 4.

4. **Sincronización Multi-dispositivo en tiempo real**:
   - Al conectarse desde el celular o cualquier computadora vía la URL pública de Ngrok (protegida por Basic Auth), cualquier cambio introducido se guardará en PostgreSQL y se reflejará inmediatamente en todos los dispositivos conectados.
