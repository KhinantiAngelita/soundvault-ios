import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path } from 'react-native-svg';

/**
 * Logo Minimalis Gradient:
 * Konsep simpel tanpa kotak pembungkus (seperti ikon SoundVault awal),
 * namun dengan bentuk lengkungan ikonik Antigravity bergradasi iOS Light Blue.
 */
export default function AntigravityLogo({ size = 28 }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <Defs>
          {/* Gradasi Utama iOS Light Blue (Atas ke Bawah) */}
          <LinearGradient id="agyMainGrad" x1="18" y1="4" x2="18" y2="31" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#BAE6FD" />
            <Stop offset="45%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>

          {/* Pendaran Halus (Inner Ambient Glow) di Bawah Lengkungan */}
          <RadialGradient
            id="agyGlowGrad"
            cx="18"
            cy="23"
            rx="10"
            ry="8"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.42" />
            <Stop offset="65%" stopColor="#0EA5E9" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Pendaran Gravitasi Halus di Bawah Lengkungan */}
        <Path
          d="M7 28 C11 16, 25 16, 29 28 Z"
          fill="url(#agyGlowGrad)"
        />

        {/* Bentuk Utama Lengkungan Antigravity (Smooth Fluid Arch Ribbon) */}
        <Path
          d="M5.5 27.5 C8.5 27.5, 12.2 7.5, 18 7.5 C23.8 7.5, 27.5 27.5, 30.5 27.5"
          stroke="url(#agyMainGrad)"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
