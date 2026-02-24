import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

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
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
};

/**
 * Obtiene el token push del dispositivo
 * Nota: En Expo Go sin proyecto configurado, esto puede fallar
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Notificaciones push requieren dispositivo físico');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Permiso de notificaciones denegado');
      return null;
    }

    // Intentar obtener token de Expo
    // Nota: Esto puede fallar en Expo Go sin projectId configurado
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (tokenError) {
      console.log('⚠️ No se pudo obtener token Expo (normal en Expo Go sin configurar):', tokenError);
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
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
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 500, 500, 500],
      autoDismiss: false,
      sticky: true,
    },
    trigger: null,
  });
};

/**
 * Configura las notificaciones para ejecutar código en background
 */
export const configureBackgroundNotifications = () => {
  Notifications.registerTaskAsync('BACKGROUND-NOTIFICATION-TASK');
};

/**
 * Envía el token push al backend
 */
export const registerTokenWithBackend = async (token: string, backendUrl: string): Promise<{success: boolean, error?: string}> => {
  try {
    console.log(`[DEBUG] Intentando conectar a: ${backendUrl}/register-token`);
    
    // Crear un AbortController para manejar timeout manual
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(`${backendUrl}/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceId: Platform.OS === 'ios' ? 'ios-device' : 'android-device',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('[DEBUG] Registro exitoso:', data);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('[DEBUG] Error en respuesta:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('[DEBUG] Error de conexión:', error);
    return { success: false, error: String(error) };
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
