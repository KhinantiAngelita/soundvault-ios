import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntigravityLogo from './AntigravityLogo';

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

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.surface,
          borderColor: theme.accentBorder,
        },
      ]}
    >
      {/* Progress Bar Tipis Light Blue */}
      <View style={[styles.progressBarBackground, { backgroundColor: theme.border }]}>
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
          <AntigravityLogo size={38} theme={theme} />
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
    shadowOpacity: 0.22,
    shadowRadius: 14,
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
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
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
