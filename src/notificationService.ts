import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configura el canal de notificaciones para Android
 * Es necesario para Android 8.0+ (API 26+)
 */
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'Alarmas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'alarm-sound.wav', // Nombre del archivo de sonido
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Ignora el modo No Molestar
    });
  }
};

/**
 * Programa una notificación local de prueba
 */
export const scheduleLocalAlarmNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 ALARMA ACTIVADA 🚨',
      body: 'Se ha detectado una alarma en el sistema',
      data: { type: 'alarm', status: 'encendido', timestamp: Date.now() },
      sound: 'alarm-sound.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 500, 500, 500],
      autoDismiss: false,
      sticky: true, // La notificación no se puede deslizar para eliminar
    },
    trigger: null, // Inmediatamente
  });
};

/**
 * Configura las notificaciones para ejecutar código en background
 * ESTO ES CRÍTICO: Permite que la app reproduzca sonido incluso cerrada
 */
export const configureBackgroundNotifications = () => {
  // Este task se ejecuta cuando llega una notificación en background
  Notifications.registerTaskAsync('BACKGROUND-NOTIFICATION-TASK');
};

/**
 * Envía el token push al backend
 */
export const registerTokenWithBackend = async (token: string, backendUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceId: Platform.OS === 'ios' ? 'ios-device' : 'android-device',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error registrando token:', error);
    return false;
  }
};

/**
 * Cancela todas las notificaciones pendientes
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Obtiene todas las notificaciones programadas
 */
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
