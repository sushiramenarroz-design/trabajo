#!/usr/bin/env python3
"""
DISPOSITIVO A - Script de Heartbeat
Envía señales de vida cada 30 segundos al backend

Instrucciones:
1. Instalar Python 3
2. No necesitas instalar nada más (usa librerías built-in)
3. Ejecutar: python heartbeat.py
"""

import urllib.request
import urllib.error
import json
import time
import socket
import platform

# ============ CONFIGURACIÓN ============
# Cambia esta URL por la de tu servidor cuando lo tengas en la nube
# Por ahora usamos localhost para pruebas
BACKEND_URL = "http://localhost:3000/heartbeat"

# Identificador único de este dispositivo
# Puedes cambiarlo: "servidor-casa", "pc-oficina", "raspberry-pi", etc.
DEVICE_ID = "dispositivo-principal"

# Cada cuántos segundos enviar heartbeat
INTERVALO_SEGUNDOS = 30

# Cuántos intentos antes de considerar fallo
MAX_REINTENTOS = 3
# ======================================


def enviar_heartbeat(intentos=0):
    """Envía una señal de vida al backend"""
    
    data = json.dumps({
        "deviceId": DEVICE_ID,
        "timestamp": time.time(),
        "hostname": socket.gethostname(),
        "platform": platform.system()
    }).encode('utf-8')
    
    req = urllib.request.Request(
        BACKEND_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print(f"✅ [{hora_actual()}] Heartbeat enviado - {DEVICE_ID}")
                return True
    except urllib.error.URLError as e:
        print(f"❌ [{hora_actual()}] Error de conexión: {e}")
    except Exception as e:
        print(f"❌ [{hora_actual()}] Error: {e}")
    
    # Reintentar si falló
    if intentos < MAX_REINTENTOS:
        print(f"🔄 Reintentando... ({intentos + 1}/{MAX_REINTENTOS})")
        time.sleep(2)
        return enviar_heartbeat(intentos + 1)
    
    return False


def hora_actual():
    """Devuelve hora formateada"""
    return time.strftime("%H:%M:%S")


def main():
    print("=" * 60)
    print("💓 DISPOSITIVO A - Sistema de Heartbeat")
    print("=" * 60)
    print(f"📱 Device ID: {DEVICE_ID}")
    print(f"🌐 Backend: {BACKEND_URL}")
    print(f"⏱️  Intervalo: {INTERVALO_SEGUNDOS} segundos")
    print(f"💻 Sistema: {platform.system()} - {socket.gethostname()}")
    print("=" * 60)
    print("Presiona CTRL+C para detener\n")
    
    # Enviar heartbeat inmediatamente al iniciar
    enviar_heartbeat()
    
    # Loop infinito enviando heartbeats
    while True:
        try:
            time.sleep(INTERVALO_SEGUNDOS)
            enviar_heartbeat()
        except KeyboardInterrupt:
            print("\n\n👋 Deteniendo heartbeat...")
            print("⚠️  Si detienes esto, el backend pensará que el dispositivo murió!")
            break


if __name__ == "__main__":
    main()
