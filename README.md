# 🚨 App de Alarma con Expo

Aplicación Android desarrollada con Expo que recibe alarmas mediante notificaciones push y reproduce un sonido a máximo volumen.

## 📋 Características

- ✅ Recibe alarmas vía **notificaciones push (FCM)**
- ✅ Funciona con la app **cerrada** o en **background**
- ✅ Reproduce sonido de alarma a **máximo volumen**
- ✅ Reproduce en **loop** hasta que se detenga manualmente
- ✅ Ignora el modo **silencioso** del dispositivo
- ✅ Muestra notificación persistente en la barra

## 🏗️ Arquitectura

```
┌─────────────────┐     POST /trigger-alarm     ┌─────────────────┐
│   Backend API   │ ──────────────────────────> │   Expo Push     │
│   (Node.js)     │                             │   (FCM/APNs)    │
└─────────────────┘                             └────────┬────────┘
                                                         │
                              ┌──────────────────────────┘
                              │ Push Notification
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Audio Service  │ <── │   App React     │ <── │  Background     │
│  (expo-av)      │     │   Native        │     │  Handler        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Instalación

### 1. Configurar la App

```bash
cd alarma-app
npm install
```

### 2. Agregar archivo de sonido

Descarga un sonido de alarma (formato `.mp3` o `.wav`) y colócalo en:
```
alarma-app/assets/alarm-sound.mp3
```

> 💡 Puedes descargar sonidos gratuitos de: [freesound.org](https://freesound.org)

### 3. Configurar Firebase (para Android)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto nuevo
3. Agrega una app Android con el package name: `com.tuusuario.alarmaapp`
4. Descarga `google-services.json` y colócalo en `alarma-app/`
5. Actualiza `app.json` con tu project ID

### 4. Ejecutar la App

```bash
# Desarrollo
npx expo start

# Construir APK (requiere EAS)
npx eas build --platform android --profile preview
```

## 🖥️ Configurar el Backend

```bash
cd backend
npm install
npm run dev
```

El servidor iniciará en `http://localhost:3000`

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register-token` | Registra un dispositivo |
| POST | `/trigger-alarm` | Activa la alarma en todos los dispositivos |
| GET | `/status` | Muestra dispositivos registrados |

### Enviar una Alarma

```bash
curl -X POST http://localhost:3000/trigger-alarm \
  -H "Content-Type: application/json" \
  -d '{"message": "Alarma de prueba"}'
```

## 📱 Cómo funciona

### Escenario 1: App en Foreground
1. Llega la notificación push
2. Se muestra la notificación
3. Se activa automáticamente el sonido de alarma
4. El usuario debe presionar "Detener Alarma"

### Escenario 2: App en Background/Cerrada
1. Llega la notificación push vía FCM
2. El `Background Task` se ejecuta automáticamente
3. Se reproduce el sonido de alarma
4. La app se abre al tocar la notificación

## ⚙️ Permisos requeridos (Android)

El `app.json` ya incluye todos los permisos necesarios:

- `RECEIVE_BOOT_COMPLETED` - Iniciar al arrancar
- `WAKE_LOCK` - Mantener despierto
- `FOREGROUND_SERVICE` - Servicio en foreground
- `NOTIFICATIONS` - Recibir notificaciones
- `VIBRATE` - Vibración
- `MODIFY_AUDIO_SETTINGS` - Controlar volumen

## 🔧 Configuración de Canales (Android 8.0+)

El canal `alarm-channel` se configura automáticamente con:
- Prioridad: **MÁXIMA**
- Sonido personalizado
- Vibration habilitada
- Ignora modo No Molestar
- Visible en pantalla de bloqueo

## 🛠️ Tecnologías utilizadas

- **Expo SDK 52+**
- **expo-notifications** - Notificaciones push
- **expo-av** - Reproducción de audio
- **expo-task-manager** - Tareas en background
- **expo-device** - Información del dispositivo
- **Node.js + Express** - Backend

## 📝 Notas importantes

### ¿Por qué notificaciones push y no polling?

| Aspecto | Notificaciones Push | Polling |
|---------|-------------------|---------|
| Funciona app cerrada | ✅ Sí | ❌ No |
| Consumo batería | 🔋 Bajo | 🔋 Alto |
| Latencia | ⚡ Inmediata | ⏱️ Minutos |
| Confiabilidad | ✅ Alta | ⚠️ Media |

### Requisitos del dispositivo

- **Android 6.0+** (API 23+)
- **Google Play Services** instalados
- Conexión a **Internet**

### Optimización de batería

En algunos dispositivos Android (Xiaomi, Samsung, Huawei), es necesario:

1. **Deshabilitar optimización de batería** para la app
2. **Permitir inicio automático**
3. **Bloquear** la app en recientes (para que no se cierre)

## 🐛 Troubleshooting

### No llegan notificaciones
- Verifica que `google-services.json` esté correctamente configurado
- Comprueba que el dispositivo tiene conexión a Internet
- Revisa que el token se envió correctamente al backend

### No suena la alarma
- Asegúrate de tener el archivo `alarm-sound.mp3` en assets
- Verifica que el volumen del dispositivo no esté en 0
- Comprueba los permisos de audio

### La app no se mantiene en background
- Configura inicio automático en ajustes del dispositivo
- Deshabilita optimización de batería para esta app
- En Xiaomi: Configuración > Apps > Permisos > Inicio automático

## 📄 Licencia

MIT - Libre para usar y modificar
