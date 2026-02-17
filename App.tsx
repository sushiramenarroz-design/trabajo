import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import { 
  setupNotificationChannel, 
  registerTokenWithBackend 
} from './src/notificationService';
import { 
  configureAlarmAudio, 
  playAlarmSound, 
  stopAlarmSound 
} from './src/audioService';

// Nombre del task de background
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// Configurar el handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // Controlamos el sonido manualmente
    shouldSetBadge: false,
  }),
});

// Definir el task de background - ESTO SE EJECUTA INCLUSO CON LA APP CERRADA
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Error en background task:', error);
    return;
  }

  if (data) {
    const notification = data.notification;
    const notificationData = notification?.request?.content?.data;
    
    // Verificar si es una alarma
    if (notificationData?.type === 'alarm' || notificationData?.status === 'encendido') {
      console.log('🚨 Alarma recibida en BACKGROUND');
      
      // Reproducir sonido de alarma
      await configureAlarmAudio();
      await playAlarmSound();
    }
  }
});

// Registrar el task de background
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [status, setStatus] = useState('En espera...');
  const [lastNotification, setLastNotification] = useState<string>('');

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initializeApp();

    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    await configureAlarmAudio();
    await setupNotificationChannel();
    await registerForPushNotifications();
    setupNotificationListeners();
  };

  const cleanup = () => {
    stopAlarmSound();
    if (notificationListener.current) {
      Notifications.removeNotificationSubscription(notificationListener.current);
    }
    if (responseListener.current) {
      Notifications.removeNotificationSubscription(responseListener.current);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        Alert.alert('Nota', 'Las notificaciones push requieren un dispositivo físico');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'No se otorgaron permisos de notificación');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
      
      // Enviar token al backend
      const registered = await registerTokenWithBackend(token);
      if (registered) {
        console.log('✅ Token registrado en backend');
      }
      
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listener para notificaciones en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data;
        setLastNotification(new Date().toLocaleTimeString());
        
        if (data?.type === 'alarm' || data?.status === 'encendido') {
          await activateAlarm();
        }
      }
    );

    // Listener para respuesta a notificaciones (usuario toca la notificación)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'alarm' || data?.status === 'encendido') {
          await activateAlarm();
        }
      }
    );
  };

  const activateAlarm = async () => {
    setIsAlarmActive(true);
    setStatus('🚨 ALARMA ACTIVADA 🚨');
    await playAlarmSound();
  };

  const deactivateAlarm = async () => {
    await stopAlarmSound();
    setIsAlarmActive(false);
    setStatus('En espera...');
  };

  const simulateAlarm = async () => {
    // Simular notificación local
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 ALARMA DE PRUEBA 🚨',
        body: 'Esta es una simulación de alarma',
        data: { type: 'alarm', status: 'encendido' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  };

  return (
    <View style={[
      styles.container,
      isAlarmActive && styles.alarmContainer
    ]}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>🔔 Sistema de Alarma</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText,
          isAlarmActive && styles.alarmStatusText
        ]}>
          {status}
        </Text>
        {lastNotification && (
          <Text style={styles.lastNotification}>
            Última notificación: {lastNotification}
          </Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📱 Dispositivo Registrado</Text>
        <Text style={styles.tokenText} numberOfLines={1}>
          {expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'Registrando...'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {isAlarmActive ? (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={deactivateAlarm}
            activeOpacity={0.8}
          >
            <Text style={styles.stopButtonText}>🔇 DETENER ALARMA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={simulateAlarm}
            activeOpacity={0.8}
          >
            <Text style={styles.testButtonText}>🧪 Probar Alarma</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          ℹ️ Esta app usa notificaciones push para recibir alarmas.
        </Text>
        <Text style={styles.infoText}>
          Funciona incluso con la app cerrada.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  alarmContainer: {
    backgroundColor: '#dc2626',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  statusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 25,
    borderRadius: 15,
    marginBottom: 25,
    minWidth: 280,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    color: '#4ade80',
    fontWeight: '600',
    textAlign: 'center',
  },
  alarmStatusText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  lastNotification: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
  },
  infoTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenText: {
    color: '#4ade80',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 10,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 40,
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
