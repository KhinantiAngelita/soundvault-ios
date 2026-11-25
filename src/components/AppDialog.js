import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';

/**
 * Dialog / Pop-up kustom yang 100% selaras dengan Design System SoundVault
 * (Font Cenura, tema Sistem/Gelap/Terang, aksen Light Blue, tanpa native Alert abu-abu).
 */
export default function AppDialog({
  visible,
  title = '',
  message = '',
  type = 'info', // 'info' | 'success' | 'danger'
  confirmText = 'OK',
  cancelText = null,
  theme,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  const isDanger = type === 'danger';
  const isSuccess = type === 'success';
  const iconName = isDanger
    ? 'trash-outline'
    : isSuccess
    ? 'checkmark-circle-outline'
    : 'information-circle-outline';
  const iconColor = isDanger ? theme.danger : theme.accent;
  const iconBg = isDanger
    ? theme.mode === 'light'
      ? 'rgba(225, 29, 72, 0.10)'
      : 'rgba(244, 63, 94, 0.16)'
    : theme.accentSoft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        activeOpacity={1}
        onPress={onCancel || onConfirm}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.mode === 'light' ? '#0F172A' : '#000000',
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>

          {!!title && (
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          )}

          {!!message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              {message}
            </Text>
          )}

          <View style={styles.btnRow}>
            {cancelText && (
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: theme.surfaceElevated },
                ]}
                onPress={onCancel}
                activeOpacity={0.75}
              >
                <Text style={[styles.btnText, { color: theme.textSecondary }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor: isDanger ? theme.danger : theme.accentStrong,
                },
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 324,
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: CENURA_FONT,
    fontSize: 16.5,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  message: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
});
