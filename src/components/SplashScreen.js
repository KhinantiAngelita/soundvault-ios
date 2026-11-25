import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import AntigravityLogo from './AntigravityLogo';
import { CENURA_FONT } from '../utils/theme';

/**
 * Animated Splash Screen Elegan & Minimalis:
 * - Efek levitasi (mengambang halus) pada logo Antigravity
 * - Gelombang cincin orbit (pulse halo) berwarna Light Blue
 * - Staggered fade-in pada tipografi SoundVault
 * - Smooth cross-fade & zoom-out saat masuk ke aplikasi
 */
export default function SplashScreen({ visible, theme, onFinish }) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;

  const pulseScale = useRef(new Animated.Value(0.65)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(12)).current;

  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset nilai awal
    containerOpacity.setValue(1);
    containerScale.setValue(1);
    logoOpacity.setValue(0);
    logoScale.setValue(0.72);
    logoTranslateY.setValue(18);
    pulseScale.setValue(0.65);
    pulseOpacity.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(12);
    barWidth.setValue(0);

    Animated.sequence([
      // Tahap 1: Logo Antigravity muncul melayang naik + gelombang halo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.55,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(pulseScale, {
          toValue: 1.75,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Tahap 2: Teks SoundVault & garis cahaya biru muncul halus
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(barWidth, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Tahan sebentar agar elegan dilihat
      Animated.delay(450),

      // Tahap 3: Smooth fade-out & subtle zoom-out membuka aplikasi
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.05,
          duration: 450,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: theme.bg,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <View style={styles.centerContent}>
        {/* Cincin Gelombang Cahaya (Orbital Pulse Halo) */}
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: theme.accent,
                backgroundColor: theme.accentSoft,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />

          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [
                { translateY: logoTranslateY },
                { scale: logoScale },
              ],
            }}
          >
            <AntigravityLogo size={76} theme={theme} />
          </Animated.View>
        </View>

        {/* Nama Aplikasi & Garis Aksen Light Blue */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            SoundVault
          </Text>

          <Animated.View
            style={[
              styles.accentLine,
              {
                backgroundColor: theme.accentStrong,
                transform: [{ scaleX: barWidth }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStage: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  brandTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.8,
  },
  accentLine: {
    width: 44,
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
  },
});
