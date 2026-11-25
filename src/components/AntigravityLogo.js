import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Logo bergaya Antigravity:
 * Bentuk cincin orbit miring dengan inti melayang (levitating core & delta wing)
 * menggunakan warna aksen Light Blue.
 */
export default function AntigravityLogo({ size = 34, theme }) {
  const scale = size / 34;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: theme.accentSoft,
          borderColor: theme.accentBorder,
        },
      ]}
    >
      {/* Cincin Orbit Luar (Elliptical Ring) */}
      <View
        style={[
          styles.orbitRing,
          {
            width: 24 * scale,
            height: 11 * scale,
            borderRadius: 12 * scale,
            borderColor: theme.accent,
          },
        ]}
      />

      {/* Sayap/Puncak Delta Antigravity */}
      <View
        style={[
          styles.deltaApex,
          {
            width: 11 * scale,
            height: 11 * scale,
            borderTopColor: theme.accentStrong,
            borderRightColor: theme.accentStrong,
            transform: [{ rotate: '-45deg' }, { translateY: -1 * scale }],
          },
        ]}
      />

      {/* Inti Melayang (Levitating Core Sphere) */}
      <View
        style={[
          styles.coreDot,
          {
            width: 6.5 * scale,
            height: 6.5 * scale,
            borderRadius: 4 * scale,
            backgroundColor: '#38BDF8',
            shadowColor: '#38BDF8',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1.6,
    transform: [{ rotate: '-24deg' }],
    opacity: 0.85,
  },
  deltaApex: {
    position: 'absolute',
    borderTopWidth: 2.2,
    borderRightWidth: 2.2,
    borderRadius: 2,
  },
  coreDot: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
