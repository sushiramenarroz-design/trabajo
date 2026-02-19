import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
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

// ==========================================
// CONFIGURACIÓN DEL BACKEND
// ==========================================
const BACKEND_URL = 'http://216.238.87.147:3001';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface BackgroundTaskData {
  notification?: {
    request: {
      content: {
        data?: {
          type?: string;
        };
      };
    };
  };
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Error en background task:', error);
    return;
  }

  const taskData = data as BackgroundTaskData | undefined;
  
  if (taskData?.notification) {
    const notificationData = taskData.notification.request.content.data;
    
    if (notificationData?.type === 'alarm') {
      console.log('🚨 Alarma recibida en BACKGROUND');
      await configureAlarmAudio();
      await playAlarmSound();
    }
  }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [status, setStatus] = useState('📱 App iniciada');
  const [logs, setLogs] = useState<string[]>([]);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    initializeApp();

    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    addLog('Inicializando app...');
    await configureAlarmAudio();
    await setupNotificationChannel();
    await registerForPushNotifications();
    setupNotificationListeners();
  };

  const cleanup = () => {
    stopAlarmSound();
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }
  };

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        Alert.alert('Nota', 'Esta app requiere un dispositivo físico Android');
        addLog('⚠️ Emulador detectado');
        return;
      }

      addLog('Solicitando permisos...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        addLog('❌ Permisos denegados');
        setStatus('⚠️ Sin permisos de notificación');
        return;
      }

      addLog('Obteniendo token...');
      
      // Intentar obtener token Expo (con projectId)
      let token: string | null = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'a1f794f3-fd3f-4eb3-b954-e0e1b86683bb'
        });
        token = tokenData.data;
        addLog('✅ Token Expo obtenido');
      } catch (expoError) {
        // Si falla, usar token local único
        addLog('⚠️ Token Expo no disponible (requiere FCM)');
        addLog('💡 Usando modo local...');
        token = `local-${Platform.OS}-${Date.now()}`;
        addLog('✅ Token local generado');
      }
      
      if (!token) {
        addLog('❌ No se pudo obtener token');
        return;
      }
      
      setExpoPushToken(token);
      
      // Enviar token al backend
      addLog('🌐 Conectando al backend...');
      addLog(`URL: ${BACKEND_URL}`);
      
      try {
        const result = await registerTokenWithBackend(token, BACKEND_URL);
        if (result.success) {
          if (token.startsWith('local-')) {
            addLog('✅ Registrado (modo local)');
            addLog('💡 Nota: App debe estar abierta para recibir alarmas');
            setStatus('✅ Listo (modo local)');
          } else {
            addLog('✅ Registrado con token Expo');
            setStatus('✅ Listo - Esperando alarmas');
          }
        } else {
          addLog(`❌ Error backend: ${result.error}`);
          setStatus('⚠️ Error de registro');
        }
      } catch (fetchError) {
        addLog(`❌ Error de red: ${fetchError}`);
        addLog('💡 Verifica tu conexión WiFi/4G');
        setStatus('⚠️ Sin conexión al servidor');
      }
      
    } catch (error) {
      console.error('Error:', error);
      addLog(`❌ Error: ${error}`);
    }
  };

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data;
        addLog(`📨 Notificación recibida`);
        
        if (data?.type === 'alarm') {
          addLog('🚨 ALARMA DETECTADA');
          await activateAlarm();
        }
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'alarm') {
          addLog('🚨 Alarma desde notificación');
          await activateAlarm();
        }
      }
    );
  };

  const activateAlarm = async () => {
    setIsAlarmActive(true);
    setStatus('🚨🚨🚨 ALARMA ACTIVA 🚨🚨🚨');
    addLog('🔊 Reproduciendo alarma');
    await playAlarmSound();
  };

  const deactivateAlarm = async () => {
    await stopAlarmSound();
    setIsAlarmActive(false);
    setStatus('✅ Listo - Esperando alarmas');
    addLog('🔇 Alarma detenida');
  };

  const simulateAlarm = async () => {
    addLog('🧪 Simulando alarma...');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 ALARMA DE PRUEBA 🚨',
        body: 'Esta es una simulación',
        data: { type: 'alarm', status: 'encendido' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  };

  return (
    <View style={[styles.container, isAlarmActive && styles.alarmContainer]}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>🔔 Sistema de Alarma</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, isAlarmActive && styles.alarmStatusText]}>
          {status}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📱 Tu Teléfono</Text>
        <Text style={styles.tokenText} numberOfLines={1}>
          {expoPushToken ? expoPushToken.substring(0, 35) + '...' : 'Registrando...'}
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

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>📋 Eventos Recientes:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>Esperando eventos...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>{log}</Text>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          ℹ️ Modo: {expoPushToken?.startsWith('local-') ? 'Local (app abierta)' : 'Expo Push'}
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
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  alarmContainer: {
    backgroundColor: '#dc2626',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    minWidth: 280,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
    textAlign: 'center',
  },
  alarmStatusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  infoTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenText: {
    color: '#4ade80',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 12,
    elevation: 5,
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
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  logsTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  logsScroll: {
    flex: 1,
  },
  logEntry: {
    color: '#aaa',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  logEmpty: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoContainer: {
    padding: 10,
    alignItems: 'center',
  },
  infoText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
  },
});
