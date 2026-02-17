# 📖 GUÍA COMPLETA PARA PRINCIPIANTES

> Esta guía te lleva paso a paso desde cero hasta tener tu sistema de alarmas funcionando.

---

## 🎯 ¿Qué vamos a hacer?

1. **Instalar programas** en tu computadora
2. **Ejecutar el backend** (servidor de alarmas)
3. **Instalar la app** en tu teléfono Android
4. **Ejecutar el Dispositivo A** (script de heartbeat)
5. **Probar** que todo funciona

---

## 📥 PASO 1: Instalar Programas Necesarios

### 1.1 Instalar Node.js (para el backend)

1. Ve a: https://nodejs.org
2. Descarga la versión **LTS** (recomendada)
3. Instálalo con todas las opciones por defecto
4. Verifica en terminal (CMD o PowerShell):
   ```bash
   node --version
   ```
   Debe mostrar algo como: `v20.11.0`

### 1.2 Instalar Python 3 (para el Dispositivo A)

1. Ve a: https://python.org/downloads
2. Descarga Python 3.11 o superior
3. **IMPORTANTE**: Durante instalación, marca:
   - ☑️ "Add Python to PATH"
   - ☑️ "Install pip"
4. Verifica en terminal:
   ```bash
   python --version
   ```
   Debe mostrar: `Python 3.11.X`

### 1.3 Instalar VS Code

1. Ve a: https://code.visualstudio.com
2. Descarga e instala
3. Abre VS Code e instala extensiones:
   - Presiona `Ctrl+Shift+X`
   - Busca e instala:
     - ✅ "Python" (de Microsoft)
     - ✅ "ES7+ React/Redux/React-Native snippets"

### 1.4 Instalar Expo Go en tu teléfono

1. Abre **Google Play Store** en tu Android
2. Busca: **"Expo Go"**
3. Instálalo

---

## 🖥️ PASO 2: Ejecutar el Backend

### 2.1 Abrir terminal en VS Code

1. Abre VS Code
2. Ve a: `Terminal` → `New Terminal`
3. Navega a la carpeta del backend:
   ```bash
   cd c:\Users\DELL\trabajo\alarma\alarma-app\backend
   ```

### 2.2 Instalar dependencias

```bash
npm install
```

Verás que instala varias cosas. Espera a que termine.

### 2.3 Iniciar el servidor

```bash
npm run dev
```

Verás algo como:
```
🚀 BACKEND DE ALARMAS - Heartbeat Monitor
============================================================
📡 Puerto: 3000

📱 Endpoints para Dispositivo A:
   POST http://localhost:3000/heartbeat
   GET  http://localhost:3000/devices

📲 Endpoints para App Móvil:
   POST http://localhost:3000/register-token
   POST http://localhost:3000/trigger-alarm

📊 Monitoreo:
   GET  http://localhost:3000/status
============================================================
```

**✅ ¡Backend funcionando! Déjalo abierto.**

---

## 📱 PASO 3: Instalar la App en tu Teléfono

### 3.1 Preparar la app

1. Abre **nueva terminal** en VS Code (`Terminal` → `New Terminal`)
2. Navega a la carpeta:
   ```bash
   cd c:\Users\DELL\trabajo\alarma\alarma-app
   ```
3. Instala dependencias:
   ```bash
   npm install
   ```

### 3.2 Obtener tu IP local (IMPORTANTE)

Necesitas saber la IP de tu computadora para que el teléfono pueda conectarse.

1. Abre **CMD** o PowerShell
2. Escribe:
   ```bash
   ipconfig
   ```
3. Busca algo como:
   ```
   Adaptador de Ethernet Wi-Fi:
      Dirección IPv4. . . . . . . . . . . . : 192.168.1.45
   ```
   
   Anota ese número: `192.168.1.45` (el tuyo será diferente)

4. Edita el archivo `App.tsx`:
   - Busca esta línea:
     ```typescript
     const BACKEND_URL = 'http://192.168.1.X:3000';
     ```
   - Cambia por tu IP:
     ```typescript
     const BACKEND_URL = 'http://192.168.1.45:3000';
     ```

### 3.3 Iniciar Expo

En la terminal (dentro de `alarma-app`):

```bash
npx expo start
```

Verás un **código QR** en la terminal.

### 3.4 Abrir en tu teléfono

1. Asegúrate que tu teléfono y computadora están en la **misma WiFi**
2. Abre la app **Expo Go** en tu teléfono
3. Toca **"Scan QR code"**
4. Escanea el código que aparece en la terminal
5. La app se cargará en tu teléfono

**✅ ¡App funcionando en tu teléfono!**

Verás la interfaz con:
- Status: "✅ Listo - Esperando alarmas"
- Tu token del dispositivo
- Un botón "Probar Alarma"

---

## 💓 PASO 4: Ejecutar el Dispositivo A (Heartbeat)

### 4.1 Abrir nueva terminal

En VS Code: `Terminal` → `New Terminal`

### 4.2 Navegar a la carpeta

```bash
cd c:\Users\DELL\trabajo\alarma\dispositivo-a
```

### 4.3 Ejecutar el script

```bash
python heartbeat.py
```

Verás:
```
============================================================
💓 DISPOSITIVO A - Sistema de Heartbeat
============================================================
📱 Device ID: dispositivo-principal
🌐 Backend: http://localhost:3000/heartbeat
⏱️  Intervalo: 30 segundos
============================================================

✅ [14:30:15] Heartbeat enviado - dispositivo-principal
✅ [14:30:45] Heartbeat enviado - dispositivo-principal
```

**✅ ¡Dispositivo A enviando heartbeats!**

---

## 🧪 PASO 5: Probar que todo funciona

### 5.1 Verificar en el backend

Abre tu navegador y ve a:
```
http://localhost:3000/status
```

Debes ver:
```json
{
  "server": "online",
  "devices": {
    "total": 1,
    "online": 1,
    "offline": 0
  },
  "phones": {
    "registered": 1
  }
}
```

### 5.2 Ver dispositivos monitoreados

```
http://localhost:3000/devices
```

Debes ver tu dispositivo con status "online".

### 5.3 Probar alarma manual

En tu teléfono, toca el botón **"🧪 Probar Alarma"**.

Debe:
1. Sonar la alarma
2. Vibrar (si tienes vibración activada)
3. Mostrar notificación

Toca **"🔇 DETENER ALARMA"** para pararla.

### 5.4 Probar alarma automática (la prueba REAL)

1. **Detén el heartbeat**: En la terminal del Dispositivo A, presiona `CTRL+C`
2. **Espera 2 minutos** (espera a que pase el timeout)
3. **Verás en el backend**:
   ```
   💀 dispositivo-principal está OFFLINE!
   🚨 ENVIANDO ALARMA: dispositivo-principal no responde...
   ```
4. **Tu teléfono debe sonar** automáticamente, ¡incluso si la app está cerrada!

**✅ ¡Sistema funcionando correctamente!**

---

## 🔧 Solución de Problemas

### ❌ "No se puede conectar al backend" en la app

**Causa**: El teléfono no puede ver tu computadora.

**Soluciones**:
1. Verifica que están en la **misma red WiFi**
2. Verifica que la IP en `App.tsx` es correcta
3. Prueba desactivando el firewall de Windows momentáneamente
4. Asegúrate que el backend está corriendo (`npm run dev`)

### ❌ "Permiso de notificaciones denegado"

**Solución**:
1. Ve a Configuración de Android
2. Apps → Expo Go → Notificaciones
3. Activa las notificaciones

### ❌ No suena la alarma cuando app está cerrada

**Causa**: Algunos Android matan apps en background.

**Solución**:
1. Ve a Configuración → Batería
2. Busca "Optimización de batería"
3. Encuentra "Expo Go" y ponlo en "No optimizar"
4. O busca "Inicio automático" y actívalo para Expo Go

### ❌ Python no se reconoce

**Solución**: Reinstala Python marcando "Add Python to PATH"

---

## 🚀 Siguientes Pasos (Cuando todo funcione local)

### Para producción real:

1. **Subir backend a la nube** (Railway, Render, AWS)
2. **Crear APK de la app** (para no depender de Expo Go)
3. **Poner el script heartbeat** en el dispositivo a monitorear
4. **Configurar dominio** y HTTPS

---

## 📞 Resumen de comandos

| Qué hacer | Comando | Dónde |
|-----------|---------|-------|
| Iniciar backend | `npm run dev` | `alarma-app/backend` |
| Iniciar app | `npx expo start` | `alarma-app` |
| Iniciar heartbeat | `python heartbeat.py` | `dispositivo-a` |
| Ver status | Navegar a `http://localhost:3000/status` | Navegador |

---

## ✅ Checklist de funcionamiento

- [ ] Backend corriendo (`npm run dev`)
- [ ] App instalada en teléfono (Expo Go)
- [ ] App muestra "✅ Listo - Esperando alarmas"
- [ ] Heartbeat enviando (python heartbeat.py)
- [ ] Backend muestra dispositivo "online"
- [ ] Prueba manual funciona (botón en app)
- [ ] Prueba automática funciona (detener heartbeat 2 min)

**¡Cuando tengas todo marcado, tu sistema está listo! 🎉**
