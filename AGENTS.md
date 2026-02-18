# AGENTS.md - Documentación del Proyecto Alarma App

> Documentación para agentes de IA trabajando en este proyecto.
> Última actualización: 2026-02-17

---

## 📦 Repositorio GitHub

| Propiedad | Valor |
|-----------|-------|
| **URL** | https://github.com/sushiramenarroz-design/trabajo |
| **Owner** | sushiramenarroz-design |
| **Repo** | trabajo |
| **Branch principal** | `main` |
| **Token** | `keys.md` (no versionar) |
| **Último commit** | `f6458f1` - docs: Actualizar AGENTS.md con estado actual completo |

### Comandos Git

```bash
# Clonar el repositorio
git clone https://github.com/sushiramenarroz-design/trabajo.git

# Ver estado
git status

# Agregar cambios
git add -A
git commit -m "descripción del cambio"
git push origin main

# Actualizar desde remoto
git pull origin main
```

---

## 🚀 DEPLOY COMPLETADO

### Backend en Producción

| Aspecto | Valor |
|---------|-------|
| **Estado** | ✅ **FUNCIONANDO** |
| **Ubicación** | Servidor VPS |
| **Puerto** | `3001` (cambiado de 3000 por conflicto) |
| **Archivo de config** | `.env` (PORT=3001) |
| **Proceso** | Corriendo con Node.js |
| **Documentación** | `DEPLOY.md` creado |

### Verificación en Servidor

```bash
# El backend responde correctamente:
curl http://localhost:3001/status

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2026-02-18T20:37:32.984Z",
  "uptime": 38.227,
  "config": {
    "timeoutMinutes": 2,
    "checkIntervalSeconds": 30
  },
  "stats": {
    "totalDevices": 0,
    "registeredTokens": 0
  },
  "devices": []
}
```

### Heartbeats en Producción

El backend ya está recibiendo heartbeats:
```
💓 Heartbeat recibido: test-device (raspberry-pi)
💓 Heartbeat recibido: test-device (raspberry-pi)
```

---

## ✅ ESTADO ACTUAL DEL PROYECTO

### ¿Qué está implementado?

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| **App Móvil** | ✅ Completa | `alarma-app/` |
| **Backend** | ✅ **DESPLEGADO Y FUNCIONANDO** | `Servidor VPS - Puerto 3001` |
| **Dispositivo A (Heartbeat)** | ✅ Completo | `dispositivo-a/` |
| **Documentación** | ✅ Completa | `GUÍA_PRINCIPIANTES.md`, `README.md` |

### Funcionalidades implementadas:
- ✅ App recibe notificaciones push en foreground y background
- ✅ **Backend desplegado en servidor** (puerto 3001)
- ✅ Backend recibe heartbeats y detecta timeouts
- ✅ Backend envía alarmas vía Expo Push
- ✅ Dispositivo A envía heartbeats cada 30s
- ✅ App reproduce sonido a máximo volumen
- ✅ App muestra logs en pantalla
- ✅ Backend expone endpoints de monitoreo
- ✅ Heartbeats funcionando en producción

---

## 🏗️ Arquitectura del Sistema Completo

Este proyecto implementa un sistema **Dead Man's Switch** (interruptor de hombre muerto):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA COMPLETA                            │
└─────────────────────────────────────────────────────────────────────────┘

  DISPOSITIVO A                    BACKEND                      APP MÓVIL
  (A Monitorear)                  (Servidor)                   (Tu Teléfono)
       │                               │                              │
       │───💓 heartbeat ──────────────▶│                              │
       │    cada 30s                   │                              │
       │                               │                              │
       │                               │◄──── register-token ─────────│
       │                               │      (al instalar app)       │
       │                               │                              │
       │        [timeout: 2min]        │                              │
       │◄────────── X ─────────────────┤                              │
       │    (no hay heartbeat)         │                              │
       │                               │                              │
       │                               │────── sendPushNotification ─▶│
       │                               │                              │
       │                               │                              │───🔊 ALARMA!
       │                               │                              │
```

### Componentes:

| Componente | Tecnología | Ubicación | Función |
|------------|-----------|-----------|---------|
| **Dispositivo A** | Python 3 | PC/Servidor/Raspberry a monitorear | Enviar heartbeats cada 30s |
| **Backend** | Node.js + Express | Servidor/Cloud | Recibir heartbeats, detectar caídas, enviar alarmas |
| **App Móvil** | React Native (Expo) | Tu teléfono Android | Recibir push notifications, reproducir alarma |

---

## 📂 Estructura del Proyecto

```
c:\Users\DELL\trabajo\alarma\
│
├── AGENTS.md                    ← Este archivo (documentación técnica)
├── GUÍA_PRINCIPIANTES.md        ← Guía paso a paso para usuarios
├── keys.md                      ← Token GitHub (NO versionar)
│
├── alarma-app/                  ← 📱 App Móvil (Expo)
│   ├── App.tsx                  ← Pantalla principal con logs y estado
│   ├── app.json                 ← Config Expo + permisos Android
│   ├── package.json
│   ├── src/
│   │   ├── notificationService.ts   ← Registro de token con backend
│   │   └── audioService.ts          ← Control de audio
│   ├── backend/                 ← 🖥️ Backend (Node.js)
│   │   ├── server.js            ← Servidor principal (340 líneas)
│   │   ├── package.json         ← Dependencias
│   │   ├── .env                 ← Variables de entorno (PORT=3001)
│   │   └── .env.example         ← Template para configuración
│   ├── dispositivo-a/           ← 💓 Script heartbeat (copia)
│   │   ├── heartbeat.py
│   │   └── README.md
│   ├── GUÍA_PRINCIPIANTES.md    ← Guía de uso incluida
│   └── README.md
│
├── dispositivo-a/               ← 💓 Script Python (original)
│   ├── heartbeat.py             ← Script que envía señales de vida
│   └── README.md
│
└── DEPLOY.md                    ← 📋 Guía de despliegue en producción
    (creado por Kimi en el servidor)
```

---

## 🛠️ Stack Tecnológico

### Dispositivo A (Heartbeat Client)
| Aspecto | Tecnología |
|---------|-----------|
| Lenguaje | Python 3.8+ |
| Librerías | built-in (urllib, json, time, socket, platform) |
| Ejecución | Script continuo con reintentos |

### Backend (Monitor & Alert Server)
| Aspecto | Tecnología |
|---------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Push Notifications | expo-server-sdk |
| Almacenamiento | Memoria (Map/Set) |
| CORS | cors |
| Variables de entorno | dotenv |

### App Móvil (Alarm Receiver)
| Aspecto | Tecnología |
|---------|-----------|
| Framework | Expo SDK 52+ |
| Lenguaje | TypeScript |
| UI | React Native |
| Notificaciones | expo-notifications |
| Audio | expo-av |
| Background Tasks | expo-task-manager |
| Device Info | expo-device |

---

## ⚡ Comandos de Desarrollo

### Dispositivo A
```bash
cd dispositivo-a
python heartbeat.py
```

### Backend (Ya desplegado en servidor)
```bash
# En servidor VPS:
cd alarma-app/backend
npm install
npm start          # Puerto 3001 (configurado en .env)

# Verificar estado:
curl http://localhost:3001/status
```

Endpoints disponibles (Puerto 3001):
- `POST /heartbeat` - Recibe heartbeats del Dispositivo A
- `GET /devices` - Lista dispositivos monitoreados con tiempo desde último ping
- `GET /devices/:id` - Estado de un dispositivo específico
- `POST /register-token` - Registra teléfono para recibir alarmas
- `POST /trigger-alarm` - Fuerza alarma manualmente
- `GET /status` - Estado general del sistema (dispositivos online/offline, teléfonos registrados)

**URL del Backend en Producción:**
- Local: `http://localhost:3001`
- Servidor: `http://IP_DEL_SERVIDOR:3001` (configurar en Dispositivo A y App)

### App Móvil
```bash
cd alarma-app
npm install
npx expo start       # Genera QR para Expo Go
```

**⚠️ IMPORTANTE**: Antes de iniciar, edita `App.tsx` y actualiza:
```typescript
const BACKEND_URL = 'http://192.168.1.X:3000';  // Tu IP local aquí
```

---

## 🔧 Configuración Clave

### Backend - Variables de Timeout y Puerto

En `backend/server.js`:

```javascript
// Puerto (definido en .env o por defecto 3000)
const PORT = process.env.PORT || 3000;

// Cuánto tiempo esperar sin heartbeat antes de alertar
const TIMEOUT_MS = 2 * 60 * 1000;  // 2 minutos

// Frecuencia de verificación
const CHECK_INTERVAL_MS = 30 * 1000;  // Cada 30 segundos
```

En `backend/.env` (servidor de producción):
```bash
PORT=3001
```

### Dispositivo A - Configuración

En `dispositivo-a/heartbeat.py`:

```python
# URL del backend (cambiar cuando esté en producción)
BACKEND_URL = "http://localhost:3000/heartbeat"
# En producción:
# BACKEND_URL = "https://tu-servidor.com/heartbeat"

# Identificador único
DEVICE_ID = "dispositivo-principal"

# Frecuencia de envío (debe ser menor que TIMEOUT_MS del backend)
INTERVALO_SEGUNDOS = 30

# Reintentos ante fallo
MAX_REINTENTOS = 3
```

### App Móvil - URL del Backend

En `App.tsx`:

```typescript
// ⚠️ CRÍTICO: Usar IP local de tu computadora, NO localhost
// Obtener IP: ejecutar 'ipconfig' en CMD
const BACKEND_URL = 'http://192.168.1.X:3000';  // Ej: 192.168.1.45
```

---

## 📋 Flujo de Datos Detallado

### 1. Inicialización

```
1. Backend inicia → setInterval cada 30s para verificar dispositivos
2. App inicia → Obtiene push token → POST /register-token
3. Dispositivo A inicia → Envía heartbeat inmediatamente
```

### 2. Operación Normal

```
Cada 30s:
Dispositivo A ──POST /heartbeat──▶ Backend
                                   Backend guarda timestamp
                                   Marca como "online"

Cada 30s (check del backend):
Backend revisa todos los dispositivos
Si (ahora - lastPing) < 2min → OK, mostrar segundos restantes
Si (ahora - lastPing) > 2min → OFFLINE → Enviar alarma
```

### 3. Detección de Caída

```
Dispositivo A se apaga/crash/pierde red
↓
No envía más heartbeats
↓
Backend (en próximo check):
  Detecta: último heartbeat hace > 2min
  Marca dispositivo como "offline"
  Llama sendAlarmToAllDevices()
  Log: "💀 {deviceId} está OFFLINE!"
  Log: "🚨 ENVIANDO ALARMA: {deviceId} no responde..."
↓
Expo Push Service envía notificación
↓
App recibe push (incluso cerrada)
↓
Background Task ejecuta playAlarmSound()
↓
🔊 ALARMA SUENA EN EL TELÉFONO
↓
Pantalla se pone ROJA
↓
Usuario presiona "DETENER ALARMA"
```

### 4. Recuperación

```
Dispositivo A vuelve a funcionar
↓
Envía heartbeat
↓
Backend detecta que estaba offline
↓
Marca como "online"
↓
Envía notificación: "✅ {deviceId} RECUPERADO"
```

---

## 🔑 Conceptos Clave

### Dead Man's Switch
El sistema asume que el dispositivo está **muerto** a menos que **demuestre lo contrario** periódicamente. Es como un "botón de seguridad" que si no se presiona, dispara la alarma.

### Heartbeat
Señal periódica (cada 30s) que dice "estoy vivo". Contiene:
- `deviceId`: Identificador único
- `timestamp`: Momento del envío
- `hostname`: Nombre de la máquina
- `platform`: Sistema operativo

Si faltan 2 heartbeats consecutivos (60s), el backend considera que el dispositivo falló.

### Expo Push Notifications
Servicio que permite enviar notificaciones a apps React Native, incluso cuando están cerradas. Usa Firebase Cloud Messaging (FCM) en Android.

### Background Task
Código JavaScript que se ejecuta cuando llega una notificación push y la app está cerrada. Permite reproducir sonido sin que el usuario abra la app.

Implementación en `App.tsx`:
```typescript
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data }) => {
  const notificationData = data.notification?.request?.content?.data;
  if (notificationData?.type === 'alarm') {
    await configureAlarmAudio();
    await playAlarmSound(); // ¡Reproduce incluso con app cerrada!
  }
});
```

---

## 🧪 Testing / Pruebas

### Flujo de prueba completo:

```bash
# Terminal 1: Backend
cd alarma-app/backend
npm run dev

# Terminal 2: Dispositivo A
cd dispositivo-a
python heartbeat.py

# Terminal 3: App (genera QR)
cd alarma-app
npx expo start
# Escanear QR con Expo Go en Android
```

### Verificar heartbeat llega:
```bash
curl http://localhost:3000/devices
```

### Simular caída (prueba real):
1. `CTRL+C` en el terminal del Dispositivo A
2. Esperar 2 minutos exactos
3. Ver en backend: "💀 dispositivo-principal está OFFLINE!"
4. Ver en backend: "🚨 ENVIANDO ALARMA..."
5. Teléfono debe sonar automáticamente

### Forzar alarma manual:
```bash
curl -X POST http://localhost:3000/trigger-alarm \
  -H "Content-Type: application/json" \
  -d '{"message": "Prueba manual", "deviceId": "test"}'
```

---

## 🐛 Debugging

### Ver logs del backend (Local)
```bash
cd alarma-app/backend
npm run dev
# Observa la salida en tiempo real
```

### Ver logs del backend (Servidor de Producción)
```bash
# Si corre con PM2:
pm2 logs alarma-backend

# Ver procesos activos:
pm2 status

# Si corre directamente con logs en archivo:
tail -f /var/log/alarma-backend.log
```

Esperar ver:
```
💓 Heartbeat recibido: dispositivo-principal (hostname)
🔍 [14:30:15] Verificando dispositivos...
   ✅ dispositivo-principal OK (alarma en 90s si no responde)
```

### Ver dispositivos registrados (Local)
```bash
curl http://localhost:3000/devices
```

### Ver dispositivos registrados (Servidor)
```bash
curl http://IP_DEL_SERVIDOR:3001/devices
```

### Ver logs de la app
Los logs aparecen en la pantalla de la app en la sección "📋 Eventos Recientes"

### Problemas comunes:

| Síntoma | Causa | Solución |
|---------|-------|----------|
| App no conecta a backend | IP incorrecta | Actualizar `BACKEND_URL` en App.tsx con IP del servidor |
| Backend no recibe heartbeats | URL incorrecta | Verificar `BACKEND_URL` en heartbeat.py apunte al servidor |
| No suena alarma cerrada | Optimización batería | Configurar "Sin restricciones" para Expo Go |
| "No hay teléfonos registrados" | App no se registró | Reabrir app, verificar conexión con servidor |
| Backend se detiene al cerrar SSH | No está usando PM2 | Configurar PM2: `pm2 start server.js --name "alarma-backend"` |

---

## ⚠️ Limitaciones Conocidas

### 1. Backend en Producción (✅ Resuelto)
- ~~Todo funciona en red WiFi local~~ → **Backend ahora en servidor VPS**
- ~~Para producción: subir backend~~ → **✅ Completado**
- **Nuevo**: Dispositivo A necesita URL pública del servidor
- **Nuevo**: App móvil necesita IP/dominio del servidor en BACKEND_URL

### 2. Optimización de Batería (Android)
Algunos fabricantes matan apps agresivamente:
- **Xiaomi**: Configuración → Apps → Permisos → Inicio automático → Expo Go
- **Samsung**: Configuración → Cuidado del dispositivo → Batería → Apps sin restricciones
- **Huawei**: Configuración → Apps → Inicio → Expo Go

### 3. Requiere Internet estable
- Si Dispositivo A pierde internet → Falsa alarma
- Si Teléfono pierde internet → No recibe alarma
- Considerar implementar "grace period" o verificación de red

### 4. Sonido de alarma
- Debes agregar archivo `assets/alarm-sound.mp3` manualmente
- No incluido en repo por derechos de autor
- Descargar de freesound.org o similar

---

## 🚀 Roadmap a Producción

### Fase 1: Desarrollo Local (✅ COMPLETADO)
- [x] Backend en localhost
- [x] App vía Expo Go
- [x] Heartbeat en Python local
- [x] Documentación completa

### Fase 2: Deploy Backend (✅ COMPLETADO)
- [x] ~~Crear cuenta en Railway/Render/Fly.io~~ → Usado VPS propio
- [x] Backend desplegado en servidor
- [x] Puerto configurado (3001)
- [x] Heartbeats funcionando en producción
- [x] Archivo `DEPLOY.md` creado con documentación

### Fase 3: Configurar Acceso Público (⏭️ SIGUIENTE)
- [ ] Configurar PM2 para mantener activo tras cerrar SSH
- [ ] Abrir firewall o configurar reverse proxy (Nginx)
- [ ] Configurar dominio (opcional)
- [ ] Actualizar URLs en Dispositivo A (usar IP/dominio del servidor)
- [ ] Actualizar URL en App móvil (BACKEND_URL)

### Fase 3: Build App Nativa
- [ ] Configurar EAS Build (Expo Application Services)
- [ ] Crear cuenta Expo
- [ ] Generar APK/AAB con `eas build`
- [ ] Instalar APK directo en teléfono (sin Expo Go)
- [ ] Configurar Firebase para notificaciones propias

### Fase 4: Producción Avanzada
- [ ] Base de datos persistente (PostgreSQL/MongoDB)
- [ ] Panel web de administración
- [ ] Múltiples dispositivos monitoreados
- [ ] Histórico de eventos
- [ ] Notificaciones SMS como fallback
- [ ] Autenticación de usuarios

---

## 📚 Documentación Adicional

| Archivo | Contenido |
|---------|-----------|
| `GUÍA_PRINCIPIANTES.md` | Guía paso a paso detallada para usuarios sin experiencia |
| `README.md` (root) | Documentación general del proyecto |
| `dispositivo-a/README.md` | Instrucciones específicas del script Python |
| `alarma-app/README.md` | Documentación de la app Expo |

### Recursos externos:
- **Expo Docs**: https://docs.expo.dev
- **Expo Push Tool**: https://expo.dev/notifications
- **Railway (hosting)**: https://railway.app
- **Render (hosting)**: https://render.com

---

## 🔄 Convenciones de Código

### Commits Git
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización sin cambios funcionales
chore: tareas de mantenimiento
style: cambios de formato
```

### Estilo de código
- **Python**: PEP 8, nombres en español (usuario prefiere español)
- **TypeScript/JavaScript**: ESLint + Prettier, camelCase
- **Comentarios**: En español
- **Variables/Funciones**: Descriptivas y en español

---

## 📞 Checklist para Continuar

### Estado Actual: Backend en Producción ✅

Cuando retomes este proyecto:

### En el Servidor (ya configurado):
- [x] Backend desplegado y funcionando (puerto 3001)
- [x] Heartbeats siendo procesados correctamente
- [ ] **Configurar PM2** para mantener activo tras cerrar SSH
- [ ] **Abrir firewall** o configurar Nginx para acceso público
- [ ] **Obtener IP pública** o configurar dominio del servidor

### En el Proyecto Local:
- [ ] Actualizar `App.tsx` con URL del servidor (no localhost)
  ```typescript
  const BACKEND_URL = 'http://IP_DEL_SERVIDOR:3001';
  ```
- [ ] Actualizar `dispositivo-a/heartbeat.py` con URL del servidor
  ```python
  BACKEND_URL = "http://IP_DEL_SERVIDOR:3001/heartbeat"
  ```
- [ ] Sincronizar cambios con GitHub (`git pull origin main`)
- [ ] Agregar archivo `assets/alarm-sound.mp3` (opcional pero recomendado)

### Pruebas de Integración:
- [ ] Dispositivo A envía heartbeats al servidor
- [ ] Backend detecta dispositivo "online" en `/status`
- [ ] App se registra correctamente en backend
- [ ] Simular caída (detener heartbeat) y verificar alarma en teléfono

---

*Documentación actualizada el 2026-02-17. Estado: ✅ Proyecto base completado, listo para fase de deploy.*
