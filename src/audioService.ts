import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let alarmSound: Audio.Sound | null = null;
let originalVolume = 1.0;

/**
 * Configura el modo de audio para alarma
 */
export const configureAlarmAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: 1,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error configurando audio:', error);
  }
};

/**
 * Reproduce el sonido de alarma
 */
export const playAlarmSound = async (): Promise<boolean> => {
  try {
    // Detener sonido anterior si existe
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
      alarmSound = null;
    }

    // Crear nuevo sonido
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/alarm-sound.mp3'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      }
    );

    alarmSound = sound;

    // Subir volumen al máximo
    await alarmSound.setVolumeAsync(1.0);

    // En Android, intentar controlar el volumen del sistema
    if (Platform.OS === 'android') {
      // Nota: Para controlar el volumen del sistema nativo
      // necesitarías un módulo nativo o expo-volume-controller
    }

    return true;
  } catch (error) {
    console.error('Error reproduciendo alarma:', error);
    return false;
  }
};

/**
 * Detiene el sonido de alarma
 */
export const stopAlarmSound = async () => {
  try {
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
      alarmSound = null;
    }
  } catch (error) {
    console.error('Error deteniendo alarma:', error);
  }
};

/**
 * Verifica si la alarma está sonando
 */
export const isAlarmPlaying = (): boolean => {
  return alarmSound !== null;
};

/**
 * Obtiene el estado del sonido
 */
export const getAlarmStatus = async (): Promise<string> => {
  if (!alarmSound) return 'stopped';
  
  const status = await alarmSound.getStatusAsync();
  if (status.isLoaded) {
    return status.isPlaying ? 'playing' : 'paused';
  }
  return 'stopped';
};
