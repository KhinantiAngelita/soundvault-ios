import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const hapticLight = () => {
  if (!isNative) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // Abaikan
  }
};

export const hapticMedium = () => {
  if (!isNative) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    // Abaikan
  }
};

export const hapticSelection = () => {
  if (!isNative) return;
  try {
    Haptics.selectionAsync();
  } catch (e) {
    // Abaikan
  }
};

export const hapticSuccess = () => {
  if (!isNative) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    // Abaikan
  }
};
