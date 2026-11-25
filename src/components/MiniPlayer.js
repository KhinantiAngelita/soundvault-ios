import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntigravityLogo from './AntigravityLogo';
import { CENURA_FONT } from '../utils/theme';

export default function MiniPlayer({
  currentSong,
  theme,
  isPlaying,
  position,
  duration,
  onPress,
  onTogglePlayPause,
  onNext,
}) {
  if (!currentSong) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const artistName = currentSong.artist || 'Unknown Artist';
  const genreName = currentSong.genre || 'Pop';
  const isLight = theme.mode === 'light';

  return (
    <View
      style={[
        styles.wrapper,
        {
          // Hanya bar MiniPlayer yang memiliki konsep Liquid Glass transparan + blur
          backgroundColor: isLight
            ? 'rgba(255, 255, 255, 0.52)'
            : 'rgba(18, 23, 33, 0.56)',
          borderColor: isLight
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(125, 211, 252, 0.25)',
        },
        Platform.OS === 'web'
          ? {
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            }
          : {},
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
            onPress={onTogglePlayPause}
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
            onPress={onNext}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="play-forward" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 18,
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
