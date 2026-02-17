# 💓 Dispositivo A - Heartbeat Client

Script Python que envía señales de vida cada 30 segundos al backend.

## 🚀 Cómo usar (Muy Fácil)

### 1. Instalar Python 3
- Ve a: https://python.org/downloads
- Descarga Python 3.11 o superior
- Instálalo (marca "Add Python to PATH" durante instalación)

### 2. Verificar instalación
Abre terminal (CMD o PowerShell) y escribe:
```bash
python --version
```
Debe mostrar algo como: `Python 3.11.0`

### 3. Ejecutar el script
```bash
cd dispositivo-a
python heartbeat.py
```

Verás algo así:
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
✅ [14:31:15] Heartbeat enviado - dispositivo-principal
```

## ⚙️ Configuración

Edita `heartbeat.py` y cambia:

```python
# Cambia la URL cuando subas el backend a internet
BACKEND_URL = "http://localhost:3000/heartbeat"
# Cuando tengas servidor:
# BACKEND_URL = "https://tu-servidor.com/heartbeat"

# Cambia el nombre del dispositivo
DEVICE_ID = "dispositivo-principal"

# Cambia cada cuánto envía señal
INTERVALO_SEGUNDOS = 30
```

## 🛑 Cómo detener

Presiona `CTRL + C` en la terminal.

⚠️ **Advertencia:** Si detienes el script, el backend detectará que el dispositivo "murió" y enviará alarma a tu teléfono.

## 🖥️ Poner en producción

### Opción 1: Ejecutar automáticamente al iniciar (Windows)
1. Presiona `Win + R`, escribe `shell:startup`
2. Crea un archivo `heartbeat.bat`:
   ```bat
   @echo off
   python "C:\ruta\completa\dispositivo-a\heartbeat.py"
   ```

### Opción 2: Servicio de Windows (Más avanzado)
Usar `NSSM` para crear un servicio Windows.

### Opción 3: Linux/Mac (Raspberry Pi, servidor)
Usar `systemd` o `pm2`.
