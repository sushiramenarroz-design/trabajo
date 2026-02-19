import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';

let alarmSound: Audio.Sound | null = null;
let isPlayingFallback = false;

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
 * Si no existe el archivo, usa vibración como fallback
 */
export const playAlarmSound = async (): Promise<boolean> => {
  try {
    // Detener sonido anterior si existe
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
      alarmSound = null;
    }

    // Intentar cargar el sonido personalizado
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/alarm-sound.mp3'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      alarmSound = sound;
      await alarmSound.setVolumeAsync(1.0);
      isPlayingFallback = false;
      console.log('✅ Sonido de alarma reproducido');
      return true;
    } catch (soundError) {
      // Si no existe el archivo, usar vibración como fallback
      console.log('⚠️ Archivo de sonido no encontrado, usando vibración...');
      isPlayingFallback = true;
      
      // Vibración continua (patrón: vibra 500ms, pausa 500ms, repite)
      if (Platform.OS === 'android') {
        Vibration.vibrate([500, 500], true);
      } else {
        Vibration.vibrate([500, 500], true);
      }
      
      return true;
    }
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
    // Detener vibración si estaba en modo fallback
    if (isPlayingFallback) {
      Vibration.cancel();
      isPlayingFallback = false;
    }
    
    // Detener sonido si existe
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
      alarmSound = null;
    }
  } catch (error) {
    console.error('Error deteniendo alarma:', error);
    // Asegurar que la vibración se detenga incluso si hay error
    Vibration.cancel();
  }
};

/**
 * Verifica si la alarma está sonando
 */
export const isAlarmPlaying = (): boolean => {
  return alarmSound !== null || isPlayingFallback;
};

/**
 * Obtiene el estado del sonido
 */
export const getAlarmStatus = async (): Promise<string> => {
  if (isPlayingFallback) return 'vibrating';
  if (!alarmSound) return 'stopped';
  
  const status = await alarmSound.getStatusAsync();
  if (status.isLoaded) {
    return status.isPlaying ? 'playing' : 'paused';
  }
  return 'stopped';
};
