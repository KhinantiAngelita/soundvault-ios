import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, formatFileSize } from '../utils/formatters';
import AntigravityLogo from './AntigravityLogo';
import { CENURA_FONT } from '../utils/theme';
import { audioPlayer } from '../services/audioService';

const { width } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.62, 234);

const SLEEP_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

export default function PlayerModal({
  visible,
  onClose,
  currentSong,
  queue = [],
  theme,
  isPlaying,
  duration,
  position,
  repeatMode,
  isShuffle,
  playbackRate = 1.0,
  sleepTimerMinutes = 0,
  sleepTimerRemainingSec = 0,
  isFavorite,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleRepeat,
  onToggleShuffle,
  onCyclePlaybackRate,
  onSetSleepTimer,
  onSelectQueueSong,
  onToggleFavorite,
  onOpenEditor,
}) {
  const [isSliding, setIsSliding] = useState(false);
  const [slidingValue, setSlidingValue] = useState(0);
  const [viewMode, setViewMode] = useState('cover'); // 'cover' | 'lyrics' | 'queue' | 'info'
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [liveProgress, setLiveProgress] = useState({
    position: position || 0,
    duration: duration || 0,
    sleepTimerRemainingSec: sleepTimerRemainingSec || 0,
  });

  useEffect(() => {
    if (!visible) return;
    const unsub = audioPlayer.subscribeProgress((data) => {
      setLiveProgress(data);
    });
    return () => unsub();
  }, [visible, currentSong?.id]);

  if (!currentSong || !visible) return null;

  const currentPos = isSliding ? slidingValue : liveProgress.position;
  const maxDuration = liveProgress.duration > 0 ? liveProgress.duration : 1;
  const activeSleepRemainingSec = liveProgress.sleepTimerRemainingSec;
  const artistName = currentSong.artist || 'Unknown Artist';
  const genreName = currentSong.genre || 'Pop';
  const albumName = currentSong.album || 'Single';
  const yearName = currentSong.year || '2026';
  const hasLyrics = Boolean(currentSong.lyrics && currentSong.lyrics.trim().length > 0);
  const hasCover = Boolean(currentSong.coverUri);

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return 'repeat';
    if (repeatMode === 'all') return 'repeat';
    return 'repeat-outline';
  };

  const formatCountdown = (totalSec) => {
    if (!totalSec || totalSec <= 0) return '';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
        {/* Header Bar + Mode Switcher (Cover | Lyrics | Antrean | Info) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={26} color={theme.textSecondary} />
          </TouchableOpacity>

          <View
            style={[
              styles.modePillBar,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {[
              { key: 'cover', label: 'Cover' },
              { key: 'lyrics', label: 'Lyrics' },
              { key: 'queue', label: 'Antrean' },
              { key: 'info', label: 'Info' },
            ].map((item) => {
              const active = viewMode === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.modePillItem,
                    active && { backgroundColor: theme.accentStrong },
                  ]}
                  onPress={() => setViewMode(item.key)}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.headerBtn, { alignItems: 'flex-end' }]}
            onPress={() =>
              onOpenEditor &&
              onOpenEditor(
                currentSong,
                viewMode === 'lyrics'
                  ? 'lyrics'
                  : viewMode === 'info'
                  ? 'details'
                  : 'cover'
              )
            }
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="create-outline" size={21} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Area Tengah: Vinyl Disc / Cover Art / Lyrics / Queue / Info Lagu */}
        <View style={styles.middleContentArea}>
          {viewMode === 'cover' && (
            <View style={styles.coverViewWrapper}>
              <View style={[styles.vinylShadow, { shadowColor: theme.accentStrong }]}>
                {hasCover ? (
                  <View
                    style={[
                      styles.customCoverFrame,
                      {
                        borderColor: theme.accentBorder,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: currentSong.coverUri }}
                      style={styles.customCoverImg}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
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
                        <AntigravityLogo size={58} theme={theme} />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Tombol Cepat Kelola Cover & Lirik */}
              <View style={styles.quickCoverActions}>
                <TouchableOpacity
                  style={[
                    styles.quickChipBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => onOpenEditor && onOpenEditor(currentSong, 'cover')}
                >
                  <Ionicons name="image-outline" size={13.5} color={theme.accent} />
                  <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>
                    {hasCover ? 'Ganti / Hapus Cover' : 'Tambah Cover'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickChipBtn,
                    {
                      backgroundColor: hasLyrics ? theme.accentSoft : theme.surface,
                      borderColor: hasLyrics ? theme.accentBorder : theme.border,
                    },
                  ]}
                  onPress={() => setViewMode('lyrics')}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={13.5}
                    color={theme.accent}
                  />
                  <Text style={[styles.quickChipText, { color: theme.accent }]}>
                    {hasLyrics ? 'Lihat Lyrics' : '+ Tambah Lyrics'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {viewMode === 'lyrics' && (
            <View
              style={[
                styles.lyricsBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.lyricsTopBar,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.lyricsBoxTitle, { color: theme.textSecondary }]}>
                  LYRICS
                </Text>
                <TouchableOpacity
                  style={styles.editInlineBtn}
                  onPress={() => onOpenEditor && onOpenEditor(currentSong, 'lyrics')}
                >
                  <Ionicons name="create-outline" size={15} color={theme.accent} />
                  <Text style={[styles.editInlineText, { color: theme.accent }]}>
                    {hasLyrics ? 'Edit Lyrics' : 'Tambah Lyrics'}
                  </Text>
                </TouchableOpacity>
              </View>

              {hasLyrics ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.lyricsScrollContent}
                >
                  <Text style={[styles.lyricsText, { color: theme.text }]}>
                    {currentSong.lyrics}
                  </Text>
                </ScrollView>
              ) : (
                <View style={styles.emptyLyricsBox}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={36}
                    color={theme.textMuted}
                  />
                  <Text style={[styles.emptyLyricsTitle, { color: theme.text }]}>
                    Belum Ada Lirik Lagu
                  </Text>
                  <Text
                    style={[
                      styles.emptyLyricsSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Tambahkan lirik lagu ini agar bisa dibaca sambil mendengarkan musik.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.addLyricsBtn,
                      { backgroundColor: theme.accentStrong },
                    ]}
                    onPress={() => onOpenEditor && onOpenEditor(currentSong, 'lyrics')}
                  >
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                    <Text style={styles.addLyricsBtnText}>Tambah Lirik Sekarang</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {viewMode === 'queue' && (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.lyricsTopBar,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.lyricsBoxTitle, { color: theme.textSecondary }]}>
                  ANTREAN PUTAR ({queue.length} LAGU)
                </Text>
                <Text style={[styles.queueModeHint, { color: theme.accent }]}>
                  {isShuffle ? 'Mode Acak Aktif' : 'Berurutan'}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {queue.map((track, idx) => {
                  const isCurrent = track.id === currentSong.id;
                  return (
                    <TouchableOpacity
                      key={track.id}
                      style={[
                        styles.queueItemRow,
                        idx < queue.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={() => onSelectQueueSong && onSelectQueueSong(track, idx)}
                    >
                      <Ionicons
                        name={isCurrent ? 'volume-high' : 'musical-note-outline'}
                        size={16}
                        color={isCurrent ? theme.accent : theme.textMuted}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.queueSongTitle,
                            { color: isCurrent ? theme.accent : theme.text },
                          ]}
                          numberOfLines={1}
                        >
                          {track.title}
                        </Text>
                        <Text
                          style={[styles.queueSongArtist, { color: theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {track.artist || 'Unknown Artist'}
                        </Text>
                      </View>
                      {isCurrent && (
                        <View
                          style={[
                            styles.nowPlayingPill,
                            { backgroundColor: theme.accentSoft },
                          ]}
                        >
                          <Text style={[styles.nowPlayingPillText, { color: theme.accent }]}>
                            Aktif
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {viewMode === 'info' && (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.lyricsTopBar,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.lyricsBoxTitle, { color: theme.textSecondary }]}>
                  INFORMASI LAGU
                </Text>
                <TouchableOpacity
                  style={styles.editInlineBtn}
                  onPress={() => onOpenEditor && onOpenEditor(currentSong, 'info')}
                >
                  <Ionicons name="options-outline" size={15} color={theme.accent} />
                  <Text style={[styles.editInlineText, { color: theme.accent }]}>
                    Edit Info
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Judul', value: currentSong.title },
                  { label: 'Artist', value: artistName },
                  { label: 'Album', value: albumName },
                  { label: 'Genre', value: genreName },
                  { label: 'Tahun', value: yearName },
                  { label: 'Durasi', value: formatTime(duration) },
                  { label: 'Ukuran File', value: formatFileSize(currentSong.size) },
                  { label: 'Format', value: currentSong.mimeType || 'audio/mpeg' },
                  { label: 'File Asli', value: currentSong.filename || '-' },
                  { label: 'Catatan', value: currentSong.notes || '-' },
                ].map((item, index, arr) => (
                  <View
                    key={item.label}
                    style={[
                      styles.infoItemRow,
                      index < arr.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.infoItemLabel, { color: theme.textSecondary }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.infoItemVal, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.value}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Baris Fitur Ekstra: Playback Speed (0.85x-1.5x) & Sleep Timer */}
        <View style={styles.extraToolsRow}>
          <TouchableOpacity
            style={[
              styles.toolPill,
              {
                backgroundColor:
                  playbackRate !== 1.0 ? theme.accentSoft : theme.surface,
                borderColor:
                  playbackRate !== 1.0 ? theme.accentBorder : theme.border,
              },
            ]}
            onPress={onCyclePlaybackRate}
          >
            <Ionicons
              name="speedometer-outline"
              size={14}
              color={playbackRate !== 1.0 ? theme.accent : theme.textSecondary}
            />
            <Text
              style={[
                styles.toolPillText,
                {
                  color:
                    playbackRate !== 1.0 ? theme.accent : theme.textSecondary,
                },
              ]}
            >
              Speed {playbackRate}x{playbackRate === 0.85 ? ' (Slowed)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolPill,
              {
                backgroundColor:
                  sleepTimerMinutes > 0 ? theme.accentSoft : theme.surface,
                borderColor:
                  sleepTimerMinutes > 0 ? theme.accentBorder : theme.border,
              },
            ]}
            onPress={() => setShowSleepPicker(!showSleepPicker)}
          >
            <Ionicons
              name="moon-outline"
              size={13.5}
              color={sleepTimerMinutes > 0 ? theme.accent : theme.textSecondary}
            />
            <Text
              style={[
                styles.toolPillText,
                {
                  color:
                    sleepTimerMinutes > 0 ? theme.accent : theme.textSecondary,
                },
              ]}
            >
              {sleepTimerMinutes > 0
                ? `Sleep (${formatCountdown(activeSleepRemainingSec)})`
                : 'Sleep Timer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pilihan Durasi Sleep Timer (Muncul Saat Diklik) */}
        {showSleepPicker && (
          <View style={styles.sleepOptionsRow}>
            {SLEEP_OPTIONS.map((opt) => {
              const active = sleepTimerMinutes === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.sleepChip,
                    {
                      backgroundColor: active
                        ? theme.accentStrong
                        : theme.surface,
                      borderColor: active ? theme.accentStrong : theme.border,
                    },
                  ]}
                  onPress={() => {
                    onSetSleepTimer && onSetSleepTimer(opt.minutes);
                    setShowSleepPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sleepChipText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Judul, Artist, Album & Favorit */}
        <View style={styles.songInfoContainer}>
          <View style={styles.titleWrapper}>
            <Text
              style={[styles.songTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {currentSong.title}
            </Text>
            <Text
              style={[styles.artistName, { color: theme.accent }]}
              numberOfLines={1}
            >
              {artistName} • {albumName} ({genreName})
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
              {formatTime(liveProgress.duration)}
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
    paddingBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  headerBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
  },
  modePillBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
  },
  modePillItem: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 13,
  },
  modePillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  middleContentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginVertical: 6,
  },
  coverViewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylShadow: {
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  customCoverFrame: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
  },
  customCoverImg: {
    width: '100%',
    height: '100%',
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
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  quickCoverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  quickChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 13,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginLeft: 5,
  },
  lyricsBox: {
    flex: 1,
    maxHeight: 270,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lyricsTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  lyricsBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  queueModeHint: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  editInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInlineText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  lyricsScrollContent: {
    paddingVertical: 6,
  },
  lyricsText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'center',
  },
  emptyLyricsBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyLyricsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyLyricsSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  addLyricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addLyricsBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  infoBox: {
    flex: 1,
    maxHeight: 270,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  infoItemVal: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1.6,
    textAlign: 'right',
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  queueSongTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  queueSongArtist: {
    fontSize: 11.5,
    marginTop: 1,
  },
  nowPlayingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  nowPlayingPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  extraToolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  toolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  toolPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginLeft: 5,
  },
  sleepOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 10,
  },
  sleepChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  sleepChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  songInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 16,
  },
  songTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: -0.4,
  },
  artistName: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '500',
  },
  sliderContainer: {
    paddingHorizontal: 20,
    marginVertical: 2,
  },
  slider: {
    width: '100%',
    height: 36,
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
    marginBottom: 6,
  },
  controlSmallBtn: {
    padding: 10,
    position: 'relative',
  },
  controlBtn: {
    padding: 10,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
