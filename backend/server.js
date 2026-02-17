const express = require('express');
const { Expo } = require('expo-server-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
const expo = new Expo();

app.use(cors());
app.use(express.json());

// Almacenamiento en memoria de tokens (en producción usa una base de datos)
const deviceTokens = new Set();

/**
 * Registra un token de dispositivo
 */
app.post('/register-token', (req, res) => {
  const { token, platform, deviceId } = req.body;
  
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: 'Token inválido' });
  }

  deviceTokens.add(token);
  console.log(`✅ Token registrado: ${token.substring(0, 20)}...`);
  
  res.json({ 
    success: true, 
    message: 'Token registrado correctamente',
    totalDevices: deviceTokens.size 
  });
});

/**
 * Envía una alarma a todos los dispositivos registrados
 */
app.post('/trigger-alarm', async (req, res) => {
  try {
    const { message = 'Alarma activada', priority = 'high' } = req.body;
    
    if (deviceTokens.size === 0) {
      return res.status(400).json({ 
        error: 'No hay dispositivos registrados' 
      });
    }

    const messages = [];
    
    for (const token of deviceTokens) {
      messages.push({
        to: token,
        sound: 'default',
        title: '🚨 ALARMA ACTIVADA 🚨',
        body: message,
        data: { 
          type: 'alarm', 
          status: 'encendido',
          timestamp: Date.now(),
          priority 
        },
        priority: 'high',
        channelId: 'alarm-channel', // Canal de Android
        // Configuración para que la notificación sea persistente
        sticky: true,
        vibrate: true,
        _displayInForeground: true,
      });
    }

    // Envía las notificaciones en chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('✅ Notificaciones enviadas:', ticketChunk);
      } catch (error) {
        console.error('❌ Error enviando notificaciones:', error);
      }
    }

    res.json({ 
      success: true, 
      message: 'Alarma enviada',
      devicesNotified: deviceTokens.size,
      tickets 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Obtiene el estado de los dispositivos registrados
 */
app.get('/status', (req, res) => {
  res.json({
    registeredDevices: deviceTokens.size,
    tokens: Array.from(deviceTokens).map(t => t.substring(0, 20) + '...')
  });
});

/**
 * Elimina un token
 */
app.post('/unregister-token', (req, res) => {
  const { token } = req.body;
  deviceTokens.delete(token);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de alarma escuchando en puerto ${PORT}`);
  console.log(`\n📱 Endpoints disponibles:`);
  console.log(`   POST /register-token  - Registrar dispositivo`);
  console.log(`   POST /trigger-alarm   - Activar alarma`);
  console.log(`   GET  /status          - Ver dispositivos`);
});
