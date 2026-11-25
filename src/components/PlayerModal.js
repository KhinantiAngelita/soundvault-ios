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
import AntigravityLogo from './AntigravityLogo';

const { width } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.66, 250);

export default function PlayerModal({
  visible,
  onClose,
  currentSong,
  theme,
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
  const artistName = currentSong.artist || 'Unknown Artist';
  const genreName = currentSong.genre || 'Pop';

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
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
        {/* Header Minimalis */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={26} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: theme.textMuted }]}>
              NOW PLAYING
            </Text>
            <View
              style={[
                styles.genreHeaderBadge,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accentBorder,
                },
              ]}
            >
              <Text style={[styles.genreHeaderText, { color: theme.accent }]}>
                {genreName}
              </Text>
            </View>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        {/* Orbital Vinyl Art dengan Logo Antigravity */}
        <View style={styles.coverContainer}>
          <View style={[styles.vinylShadow, { shadowColor: theme.accentStrong }]}>
            <View
              style={[
                styles.vinylDisc,
                {
                  backgroundColor: theme.vinylDisc,
                  borderColor: theme.vinylBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.vinylGrooves,
                  { borderColor: theme.vinylGroove },
                ]}
              >
                <View
                  style={[
                    styles.vinylCenter,
                    {
                      backgroundColor: theme.vinylCenter,
                      borderColor: theme.accentBorder,
                    },
                  ]}
                >
                  <AntigravityLogo size={64} theme={theme} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Judul, Artist & Favorit */}
        <View style={styles.songInfoContainer}>
          <View style={styles.titleWrapper}>
            <Text
              style={[styles.songTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {currentSong.title}
            </Text>
            <Text
              style={[styles.artistName, { color: theme.accent }]}
              numberOfLines={1}
            >
              {artistName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onToggleFavorite(currentSong.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? theme.danger : theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Scrubber / Slider Light Blue */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxDuration}
            value={currentPos}
            minimumTrackTintColor={theme.accentStrong}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.accentStrong}
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
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {formatTime(currentPos)}
            </Text>
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Kontrol Pemutar */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlSmallBtn}
            onPress={onToggleShuffle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isShuffle ? 'shuffle' : 'shuffle-outline'}
              size={23}
              color={isShuffle ? theme.accent : theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onPrevious}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={30} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playPauseBtn,
              {
                backgroundColor: theme.accentStrong,
                shadowColor: theme.accentStrong,
              },
            ]}
            onPress={onTogglePlayPause}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={34}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 3 } : {}}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={30} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlSmallBtn}
            onPress={onToggleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={getRepeatIcon()}
              size={23}
              color={repeatMode !== 'off' ? theme.accent : theme.textMuted}
            />
            {repeatMode === 'one' && (
              <View
                style={[
                  styles.repeatBadge,
                  { backgroundColor: theme.accentStrong },
                ]}
              >
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
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
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
    fontSize: 10.5,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  genreHeaderBadge: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  genreHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  vinylShadow: {
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  vinylDisc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  vinylGrooves: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  artistName: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  sliderContainer: {
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  slider: {
    width: '100%',
    height: 38,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: -6,
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  controlSmallBtn: {
    padding: 10,
    position: 'relative',
  },
  controlBtn: {
    padding: 10,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  repeatBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    borderRadius: 6,
    width: 13,
    height: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
});
