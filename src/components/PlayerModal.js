import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '../utils/formatters';

const { width } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.68, 260);

export default function PlayerModal({
  visible,
  onClose,
  currentSong,
  isPlaying,
  duration,
  position,
  repeatMode,
  isShuffle,
  isFavorite,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleRepeat,
  onToggleShuffle,
  onToggleFavorite,
}) {
  const [isSliding, setIsSliding] = useState(false);
  const [slidingValue, setSlidingValue] = useState(0);

  if (!currentSong) return null;

  const currentPos = isSliding ? slidingValue : position;
  const maxDuration = duration > 0 ? duration : 1;

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return 'repeat';
    if (repeatMode === 'all') return 'repeat';
    return 'repeat-outline';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={28} color="#E5E7EB" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>SEDANG DIPUTAR</Text>
            <Text style={styles.headerSubtitle}>SoundVault Offline</Text>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        {/* Vinyl / Cover Art Container */}
        <View style={styles.coverContainer}>
          <View style={styles.vinylShadow}>
            <View style={styles.vinylDisc}>
              <View style={styles.vinylGrooves}>
                <View style={styles.vinylCenter}>
                  <Ionicons
                    name="musical-notes"
                    size={48}
                    color="#8B5CF6"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info & Favorite */}
        <View style={styles.songInfoContainer}>
          <View style={styles.titleWrapper}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {currentSong.title}
            </Text>
            <Text style={styles.artistName}>Penyimpanan Lokal iPhone</Text>
          </View>
          <TouchableOpacity
            onPress={() => onToggleFavorite(currentSong.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Scrubber / Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxDuration}
            value={currentPos}
            minimumTrackTintColor="#8B5CF6"
            maximumTrackTintColor="#374151"
            thumbTintColor="#FFFFFF"
            onValueChange={(val) => {
              setIsSliding(true);
              setSlidingValue(val);
            }}
            onSlidingComplete={async (val) => {
              setIsSliding(false);
              await onSeek(val);
            }}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.controlsRow}>
          {/* Shuffle Button */}
          <TouchableOpacity
            style={styles.controlSmallBtn}
            onPress={onToggleShuffle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isShuffle ? 'shuffle' : 'shuffle-outline'}
              size={24}
              color={isShuffle ? '#A78BFA' : '#6B7280'}
            />
          </TouchableOpacity>

          {/* Previous Button */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onPrevious}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={32} color="#F3F4F6" />
          </TouchableOpacity>

          {/* Big Play/Pause Button */}
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={onTogglePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 4 } : {}}
            />
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={32} color="#F3F4F6" />
          </TouchableOpacity>

          {/* Repeat Button */}
          <TouchableOpacity
            style={styles.controlSmallBtn}
            onPress={onToggleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={getRepeatIcon()}
              size={24}
              color={repeatMode !== 'off' ? '#A78BFA' : '#6B7280'}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F14',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  coverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  vinylShadow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  vinylDisc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    backgroundColor: '#16161F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#242433',
  },
  vinylGrooves: {
    width: '85%',
    height: '85%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#282838',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#201F30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF644',
  },
  songInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 16,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  artistName: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: -8,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  controlSmallBtn: {
    padding: 10,
    position: 'relative',
  },
  controlBtn: {
    padding: 10,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  repeatBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
