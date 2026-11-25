import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MiniPlayer({
  currentSong,
  isPlaying,
  position,
  duration,
  onPress,
  onTogglePlayPause,
  onNext,
}) {
  if (!currentSong) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={styles.wrapper}>
      {/* Progress Bar Tipis di Bagian Atas Mini Player */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.discIcon}>
          <Ionicons
            name="disc"
            size={26}
            color={isPlaying ? '#8B5CF6' : '#9CA3AF'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {currentSong.title}
          </Text>
          <Text style={styles.status}>
            {isPlaying ? 'Sedang Memutar' : 'Dijeda'}
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
              color="#F3F4F6"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onNext}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="play-forward" size={24} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1E1E28',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#2D2D3D',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#8B5CF6',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  discIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    color: '#9CA3AF',
    fontSize: 11,
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
