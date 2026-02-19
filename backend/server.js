const express = require('express');
const { Expo } = require('expo-server-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
const expo = new Expo();

app.use(cors());
app.use(express.json());

// ==========================================
// BASE DE DATOS EN MEMORIA
// ==========================================

// Tokens de dispositivos móviles (tu teléfono)
const mobileTokens = new Set();

// Heartbeats recibidos: deviceId -> { lastPing, status }
const devices = new Map();

// ==========================================
// CONFIGURACIÓN DE HEARTBEATS
// ==========================================

// Cuánto tiempo esperar sin heartbeat antes de considerar OFFLINE (en milisegundos)
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos

// Cada cuánto revisar los dispositivos (en milisegundos)
const CHECK_INTERVAL_MS = 30 * 1000; // 30 segundos

// ==========================================
// ENDPOINTS DEL DISPOSITIVO A (HEARTBEATS)
// ==========================================

/**
 * POST /heartbeat - El dispositivo A llama esto cada X segundos
 */
app.post('/heartbeat', (req, res) => {
  const { deviceId, timestamp, hostname, platform } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId requerido' });
  }

  const now = Date.now();
  const wasOffline = devices.has(deviceId) && devices.get(deviceId).status === 'offline';
  
  // Guardar o actualizar el dispositivo
  devices.set(deviceId, {
    deviceId,
    lastPing: now,
    status: 'online',
    hostname: hostname || 'unknown',
    platform: platform || 'unknown',
    firstSeen: devices.get(deviceId)?.firstSeen || now
  });

  // Si estaba offline y ahora volvió, notificar
  if (wasOffline) {
    console.log(`🟢 ${deviceId} ha vuelto a estar ONLINE`);
    sendNotificationToAll(`✅ ${deviceId} RECUPERADO`, 
      `El dispositivo ha vuelto a enviar señales de vida`);
  } else {
    console.log(`💓 Heartbeat recibido: ${deviceId} (${hostname || 'unknown'})`);
  }

  res.json({ 
    success: true, 
    message: 'Heartbeat registrado',
    serverTime: new Date().toISOString()
  });
});

/**
 * GET /devices - Ver estado de todos los dispositivos monitoreados
 */
app.get('/devices', (req, res) => {
  const now = Date.now();
  const devicesList = [];
  
  for (const [id, device] of devices) {
    const timeSinceLastPing = now - device.lastPing;
    const secondsAgo = Math.floor(timeSinceLastPing / 1000);
    
    devicesList.push({
      ...device,
      secondsSinceLastPing: secondsAgo,
      timeSinceLastPing: `${secondsAgo}s ago`,
      isHealthy: timeSinceLastPing < TIMEOUT_MS
    });
  }
  
  res.json({
    count: devicesList.length,
    timeoutConfigured: `${TIMEOUT_MS / 1000} segundos`,
    checkInterval: `${CHECK_INTERVAL_MS / 1000} segundos`,
    devices: devicesList
  });
});

/**
 * GET /devices/:id - Ver estado de un dispositivo específico
 */
app.get('/devices/:id', (req, res) => {
  const device = devices.get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Dispositivo no encontrado' });
  }
  
  const now = Date.now();
  const timeSinceLastPing = now - device.lastPing;
  
  res.json({
    ...device,
    secondsSinceLastPing: Math.floor(timeSinceLastPing / 1000),
    isHealthy: timeSinceLastPing < TIMEOUT_MS,
    willTriggerAlarmIn: Math.max(0, Math.floor((TIMEOUT_MS - timeSinceLastPing) / 1000))
  });
});

// ==========================================
// ENDPOINTS DE LA APP MÓVIL
// ==========================================

/**
 * POST /register-token - Tu teléfono se registra para recibir alarmas
 */
app.post('/register-token', (req, res) => {
  const { token, platform, deviceId } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  // Verificar si es token de Expo o token local (modo desarrollo)
  const isExpoToken = Expo.isExpoPushToken(token);
  const isLocalToken = token.startsWith('local-');
  
  if (!isExpoToken && !isLocalToken) {
    return res.status(400).json({ 
      error: 'Token inválido',
      details: 'El token debe ser un Expo Push Token válido o un token local (local-...)' 
    });
  }

  mobileTokens.add(token);
  
  if (isLocalToken) {
    console.log(`📱 Token LOCAL registrado (modo desarrollo): ${token.substring(0, 30)}...`);
    console.log('💡 Nota: Las notificaciones push remotas NO funcionarán con token local');
    console.log('   Usa el botón "Probar Alarma" en la app para probar localmente');
  } else {
    console.log(`📱 Token Expo registrado: ${token.substring(0, 20)}...`);
  }
  
  res.json({ 
    success: true, 
    message: 'Teléfono registrado para alarmas',
    tokenType: isLocalToken ? 'local' : 'expo',
    totalPhones: mobileTokens.size 
  });
});

/**
 * POST /trigger-alarm - Forzar alarma manualmente
 */
app.post('/trigger-alarm', async (req, res) => {
  try {
    const { message = 'Alarma activada', deviceId } = req.body;
    
    const result = await sendAlarmToAllDevices(message, deviceId);
    
    res.json({ 
      success: true, 
      message: 'Alarma enviada',
      notifiedPhones: mobileTokens.size,
      result 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /status - Estado general del sistema
 */
app.get('/status', (req, res) => {
  const now = Date.now();
  let onlineCount = 0;
  let offlineCount = 0;
  
  for (const device of devices.values()) {
    if (now - device.lastPing < TIMEOUT_MS) {
      onlineCount++;
    } else {
      offlineCount++;
    }
  }
  
  res.json({
    server: 'online',
    timestamp: new Date().toISOString(),
    devices: {
      total: devices.size,
      online: onlineCount,
      offline: offlineCount,
      maxTimeout: `${TIMEOUT_MS / 1000} segundos`
    },
    phones: {
      registered: mobileTokens.size
    }
  });
});

// ==========================================
// FUNCIONES DE ALARMA
// ==========================================

/**
 * Enviar notificación a todos los teléfonos registrados
 * Nota: Los tokens locales (modo desarrollo) se registran pero no reciben push
 */
async function sendNotificationToAll(title, body, data = {}) {
  if (mobileTokens.size === 0) {
    console.log('⚠️ No hay teléfonos registrados para recibir notificaciones');
    return { success: false, reason: 'no_phones_registered' };
  }

  // Separar tokens de Expo (reales) de tokens locales (desarrollo)
  const expoTokens = [];
  const localTokens = [];
  
  for (const token of mobileTokens) {
    if (Expo.isExpoPushToken(token)) {
      expoTokens.push(token);
    } else if (token.startsWith('local-')) {
      localTokens.push(token);
    }
  }
  
  console.log(`📱 Tokens registrados: ${expoTokens.length} Expo, ${localTokens.length} locales`);

  // Si hay tokens locales, solo loggear (no se pueden enviar push)
  if (localTokens.length > 0) {
    console.log('💡 Tokens locales detectados:');
    console.log('   La app debe estar ABIERTA para recibir alarmas');
    console.log('   Para notificaciones push reales, configura un projectId de Expo');
  }

  // Enviar notificaciones solo a tokens de Expo válidos
  if (expoTokens.length === 0) {
    console.log('⚠️ No hay tokens Expo válidos. No se enviarán notificaciones push.');
    return { 
      success: true, 
      warning: 'No Expo tokens found',
      localTokens: localTokens.length,
      message: 'Solo tokens locales registrados. La app debe estar abierta.' 
    };
  }

  const messages = [];
  
  for (const token of expoTokens) {
    messages.push({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { 
        type: 'alarm', 
        ...data,
        timestamp: Date.now() 
      },
      priority: 'high',
      channelId: 'alarm-channel',
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log(`✅ Notificaciones enviadas a ${chunk.length} dispositivos`);
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  return { 
    success: true, 
    expoTokens: expoTokens.length,
    localTokens: localTokens.length,
    tickets 
  };
}

/**
 * Enviar alarma por dispositivo caído
 */
async function sendAlarmToAllDevices(reason, deviceId) {
  const title = '🚨 DISPOSITIVO CAÍDO 🚨';
  const body = deviceId 
    ? `${deviceId} no responde: ${reason}`
    : `Alarma: ${reason}`;
  
  console.log(`🚨 ENVIANDO ALARMA: ${body}`);
  
  return await sendNotificationToAll(title, body, {
    alarmType: 'device_down',
    deviceId: deviceId
  });
}

// ==========================================
// MONITOREO DE DISPOSITIVOS (CRÍTICO)
// ==========================================

console.log('⏱️ Iniciando monitoreo de dispositivos...');
console.log(`   - Timeout: ${TIMEOUT_MS / 1000} segundos sin heartbeat = ALARMA`);
console.log(`   - Verificación cada: ${CHECK_INTERVAL_MS / 1000} segundos`);

setInterval(() => {
  const now = Date.now();
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Verificando dispositivos...`);
  
  for (const [deviceId, device] of devices) {
    // Solo revisar dispositivos que estén online
    if (device.status === 'offline') continue;
    
    const timeSinceLastPing = now - device.lastPing;
    
    if (timeSinceLastPing > TIMEOUT_MS) {
      console.log(`💀 ${deviceId} está OFFLINE! (último ping hace ${Math.floor(timeSinceLastPing/1000)}s)`);
      
      // Marcar como offline
      device.status = 'offline';
      devices.set(deviceId, device);
      
      // ENVIAR ALARMA A TODOS LOS TELÉFONOS
      sendAlarmToAllDevices(
        `No ha enviado heartbeat en ${Math.floor(timeSinceLastPing/1000)} segundos`,
        deviceId
      );
    } else {
      const remaining = Math.floor((TIMEOUT_MS - timeSinceLastPing) / 1000);
      console.log(`   ✅ ${deviceId} OK (alarma en ${remaining}s si no responde)`);
    }
  }
  
  if (devices.size === 0) {
    console.log('   ℹ️ No hay dispositivos registrados aún');
  }
  
}, CHECK_INTERVAL_MS);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BACKEND DE ALARMAS - Heartbeat Monitor');
  console.log('='.repeat(60));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`\n📱 Endpoints para Dispositivo A:`);
  console.log(`   POST http://localhost:${PORT}/heartbeat`);
  console.log(`   GET  http://localhost:${PORT}/devices`);
  console.log(`\n📲 Endpoints para App Móvil:`);
  console.log(`   POST http://localhost:${PORT}/register-token`);
  console.log(`   POST http://localhost:${PORT}/trigger-alarm`);
  console.log(`\n📊 Monitoreo:`);
  console.log(`   GET  http://localhost:${PORT}/status`);
  console.log('='.repeat(60) + '\n');
});
