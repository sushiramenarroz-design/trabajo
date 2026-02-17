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

## 📱 Descripción del Proyecto

**Nombre:** Alarma App (Expo/React Native)  
**Propósito:** Aplicación Android que recibe alarmas mediante notificaciones push y reproduce sonido a máximo volumen.

### Funcionamiento principal:
1. Backend envía notificación push vía FCM (Firebase Cloud Messaging)
2. App recibe notificación (incluso cerrada)
3. Se reproduce sonido de alarma en loop
4. Usuario debe detener manualmente la alarma

---

## 🏗️ Estructura del Proyecto

```
c:\Users\DELL\trabajo\alarma\alarma-app/
├── App.tsx                      # Entry point principal
├── app.json                     # Configuración Expo (permisos, plugins)
├── package.json                 # Dependencias
├── src/
│   ├── notificationService.ts   # Servicio de notificaciones push
│   └── audioService.ts          # Servicio de reproducción de audio
├── backend/
│   ├── server.js                # Servidor Express para enviar alarmas
│   ├── package.json             # Dependencias backend
│   └── .env.example             # Variables de entorno
├── assets/
│   ├── icon.png                 # Icono de la app
│   ├── splash-icon.png          # Icono splash
│   ├── alarm-sound.mp3          # Sonido de alarma (AGREGAR)
│   └── notification-icon.png    # Icono notificaciones
└── README.md                    # Documentación
```

---

## 🛠️ Tecnología Stack

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Expo SDK | 52+ |
| Lenguaje | TypeScript | 5.x |
| UI | React Native | 0.76+ |
| Notificaciones | expo-notifications | ~0.29 |
| Audio | expo-av | ~14.0 |
| Background | expo-task-manager | ~12.0 |
| Backend | Node.js + Express | 18+ |
| Push Service | Expo Push / FCM | - |

---

## ⚡ Comandos de Desarrollo

### App (Frontend)
```bash
cd alarma-app

# Iniciar en desarrollo
npx expo start

# Iniciar en Android
npm run android

# Construir con EAS
npx eas build --platform android --profile preview

# Limpiar caché
npx expo start --clear
```

### Backend
```bash
cd alarma-app/backend

# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Producción
npm start
```

---

## 📋 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUJO DE ALARMA                         │
└─────────────────────────────────────────────────────────────────┘

1. DETECCIÓN (Tu sistema/Backend)
   │
   │ POST /trigger-alarm
   │ { "message": "Alarma detectada" }
   ▼
2. BACKEND (Node.js/Express)
   │
   │ expo.sendPushNotificationsAsync()
   ▼
3. EXPO PUSH SERVICE
   │
   │ FCM (Firebase Cloud Messaging)
   ▼
4. DISPOSITIVO ANDROID
   │
   ├─► Si app en FOREGROUND:
   │   └─► notificationListener ──► playAlarmSound()
   │
   └─► Si app en BACKGROUND:
       └─► Background Task ──► playAlarmSound()
```

---

## 🔑 Conceptos Clave

### ¿Por qué Notificaciones Push vs Polling?

| Característica | Notificaciones Push | Polling HTTP |
|----------------|---------------------|--------------|
| App cerrada | ✅ Funciona | ❌ No funciona |
| Latencia | ⚡ < 5 segundos | ⏱️ Minutos |
| Batería | 🔋 Bajo consumo | 🔋 Alto consumo |
| Confiabilidad | ✅ Alta | ⚠️ Variable |
| Complejidad | Media | Baja |

### Manejo de Background (Crítico)

```typescript
// ESTO SE EJECUTA INCLUSO CON LA APP CERRADA
TaskManager.defineTask('BACKGROUND-NOTIFICATION-TASK', async ({ data }) => {
  const notification = data.notification;
  const notificationData = notification?.request?.content?.data;
  
  if (notificationData?.type === 'alarm') {
    await configureAlarmAudio();
    await playAlarmSound(); // ¡Reproduce alarma!
  }
});
```

### Configuración de Audio

```typescript
await Audio.setAudioModeAsync({
  staysActiveInBackground: true,  // Crítico para background
  playsInSilentModeIOS: true,     // Ignora modo silencio
  shouldDuckAndroid: false,       // No baja volumen de otras apps
  playThroughEarpieceAndroid: false, // Usa altavoz principal
});
```

---

## 🔧 Configuración Requerida

### 1. Firebase (Obligatorio para Android)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Agregar app Android
3. Descargar `google-services.json` → colocar en `alarma-app/`
4. El package name debe coincidir con `app.json`:
   ```json
   {
     "android": {
       "package": "com.tuusuario.alarmaapp"
     }
   }
   ```

### 2. Archivo de Sonido

- Descargar sonido de alarma (`.mp3` o `.wav`)
- Colocar en: `alarma-app/assets/alarm-sound.mp3`
- Referenciar en `app.json`:
  ```json
  {
    "plugins": [
      ["expo-notifications", {
        "sounds": ["./assets/alarm-sound.wav"]
      }]
    ]
  }
  ```

### 3. Permisos Android (ya configurados en app.json)

```json
{
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "WAKE_LOCK",
      "FOREGROUND_SERVICE",
      "NOTIFICATIONS",
      "VIBRATE",
      "MODIFY_AUDIO_SETTINGS"
    ]
  }
}
```

---

## 🐛 Debugging

### Logs importantes
```bash
# Ver logs del dispositivo
npx expo logs

# Filtrar por tag
adb logcat -s "ReactNative"
```

### Problemas comunes y soluciones

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| No llegan notificaciones | Token no registrado | Verificar POST a /register-token |
| No suena alarma | Archivo de audio faltante | Agregar alarm-sound.mp3 a assets |
| App no inicia en background | Optimización batería | Deshabilitar en ajustes del dispositivo |
| Sonido bajo | Volumen del sistema | Implementar control de volumen nativo |
| Notificación no persistente | Configuración canal | Verificar AndroidImportance.MAX |

---

## 🚀 Deployment

### Android (APK/AAB)

```bash
# Configurar EAS
npx eas login
npx eas build:configure

# Construir APK de prueba
npx eas build --platform android --profile preview

# Construir AAB para Play Store
npx eas build --platform android --profile production
```

### Backend

```bash
# Docker (recomendado)
docker build -t alarma-backend .
docker run -p 3000:3000 alarma-backend

# O directamente
npm start
```

---

## 📚 Recursos Útiles

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo AV Audio Docs](https://docs.expo.dev/versions/latest/sdk/av/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Firebase Console](https://console.firebase.google.com/)

---

## 🔄 Convenciones de Código

### Estilo
- Usar TypeScript estricto
- Nombres de funciones: camelCase
- Nombres de componentes: PascalCase
- Constants: UPPER_SNAKE_CASE

### Estructura de commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
chore: tareas de mantenimiento
```

---

## 📝 Tareas Pendientes / Mejoras Futuras

- [ ] Implementar control de volumen del sistema (nativo)
- [ ] Agregar soporte para iOS
- [ ] Implementar reconocimiento de voz para detener alarma
- [ ] Agregar notificaciones SMS como fallback
- [ ] Implementar geolocalización al activar alarma
- [ ] Agregar múltiples tonos de alarma configurables
- [ ] Implementar historial de alarmas
- [ ] Agregar autenticación de usuarios

---

## ⚠️ Limitaciones Conocidas

1. **Algunos dispositivos Android** (Xiaomi, Samsung) matan apps en background agresivamente
   - Solución: Pedir al usuario deshabilitar optimización de batería

2. **Modo bajo consumo** puede detener la app
   - Solución: Usar `WAKE_LOCK` permiso (ya configurado)

3. **Control de volumen del sistema** requiere módulo nativo
   - Actual: Solo controla volumen del sonido de la app
   - Futuro: Integrar con módulo nativo para volumen del sistema

---

*Documentación generada automáticamente. Mantener actualizada al hacer cambios significativos.*
