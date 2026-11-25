import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntigravityLogo from './AntigravityLogo';
import { CENURA_FONT } from '../utils/theme';
import { audioPlayer } from '../services/audioService';
import { hapticLight } from '../utils/haptics';

function MiniPlayer({
  currentSong,
  theme,
  isPlaying,
  onPress,
  onTogglePlayPause,
  onNext,
  onPrevious,
}) {
  const [prog, setProg] = useState({ position: 0, duration: 0 });
  const swipeX = useRef(new Animated.Value(0)).current;
  const callbacksRef = useRef({ onNext, onPrevious });
  callbacksRef.current = { onNext, onPrevious };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(-72, Math.min(72, gesture.dx * 0.65));
        swipeX.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -48 && callbacksRef.current.onNext) {
          hapticLight();
          callbacksRef.current.onNext();
        } else if (gesture.dx > 48 && callbacksRef.current.onPrevious) {
          hapticLight();
          callbacksRef.current.onPrevious();
        }
        Animated.spring(swipeX, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (!currentSong) return;
    const unsub = audioPlayer.subscribeProgress(({ position, duration }) => {
      setProg({ position, duration });
    });
    return () => unsub();
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const progress = prog.duration > 0 ? Math.min(prog.position / prog.duration, 1) : 0;
  const artistName = currentSong.artist || 'Unknown Artist';
  const genreName = currentSong.genre || 'Pop';
  const isLight = theme.mode === 'light';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        {
          backgroundColor: isLight ? '#FFFFFF' : '#151B26',
          borderColor: theme.border,
          shadowColor: isLight ? '#0F172A' : '#000000',
          transform: [{ translateX: swipeX }],
        },
      ]}
    >
      {/* Progress Bar Tipis Light Blue di Atas (Persis seperti sebelumnya) */}
      <View
        style={[
          styles.progressBarBackground,
          {
            backgroundColor: isLight
              ? 'rgba(14, 165, 233, 0.14)'
              : 'rgba(255, 255, 255, 0.10)',
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: theme.accentStrong,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.logoWrap}>
          {currentSong.coverUri ? (
            <Image
              source={{ uri: currentSong.coverUri }}
              style={styles.miniCoverImg}
              resizeMode="cover"
            />
          ) : (
            <AntigravityLogo size={34} theme={theme} />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {currentSong.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {artistName} • {genreName}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              hapticLight();
              onTogglePlayPause && onTogglePlayPause();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={36}
              color={theme.accentStrong}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => {
              hapticLight();
              onNext && onNext();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="play-forward" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
  },
  progressBarBackground: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: 3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  logoWrap: {
    marginRight: 12,
  },
  miniCoverImg: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: CENURA_FONT,
    fontSize: 11.5,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    marginLeft: 10,
  },
});

export default memo(MiniPlayer);
