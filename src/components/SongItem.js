import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';
import AppDialog from './AppDialog';

const SWIPE_ACTIONS_WIDTH = 186;

function SongItem({
  song,
  theme,
  isPlaying,
  isCurrentSong,
  isFavorite,
  isSelectionMode = false,
  isSelected = false,
  playlists = [],
  onPress,
  onLongPress,
  onToggleSelect,
  onPlayNext,
  onRemoveFromPlaylist,
  onToggleFavorite,
  onToggleSongInPlaylist,
  onCreatePlaylist,
  onEdit,
  onDelete,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpenRef = useRef(false);
  const selectionModeRef = useRef(isSelectionMode);
  selectionModeRef.current = isSelectionMode;

  const closeSwipe = () => {
    isSwipedOpenRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 85,
      useNativeDriver: true,
    }).start();
  };

  const openSwipe = () => {
    isSwipedOpenRef.current = true;
    hapticSelection();
    Animated.spring(translateX, {
      toValue: -SWIPE_ACTIONS_WIDTH,
      friction: 8,
      tension: 85,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (isSelectionMode && isSwipedOpenRef.current) {
      closeSwipe();
    }
  }, [isSelectionMode]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !selectionModeRef.current &&
        Math.abs(g.dx) > 14 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
      onPanResponderMove: (_, g) => {
        const base = isSwipedOpenRef.current ? -SWIPE_ACTIONS_WIDTH : 0;
        const next = Math.min(0, Math.max(-SWIPE_ACTIONS_WIDTH - 14, base + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const base = isSwipedOpenRef.current ? -SWIPE_ACTIONS_WIDTH : 0;
        const finalX = base + g.dx;
        if (finalX < -SWIPE_ACTIONS_WIDTH * 0.42 || g.vx < -0.45) {
          openSwipe();
        } else {
          closeSwipe();
        }
      },
      onPanResponderTerminate: () => {
        if (isSwipedOpenRef.current) openSwipe();
        else closeSwipe();
      },
    })
  ).current;

  const artistName = song.artist || 'Unknown Artist';
  const genreName = song.genre || 'Pop';
  const hasLyrics = Boolean(song.lyrics && song.lyrics.trim().length > 0);
  const hasCover = Boolean(song.coverUri);

  const handleCreateNewPlaylist = async () => {
    const clean = newPlaylistName.trim();
    if (!clean || !onCreatePlaylist) return;
    setNewPlaylistName('');
    await onCreatePlaylist(clean, song.id);
  };

  return (
    <>
      <View style={styles.swipeContainer}>
        {/* 3 Aksi Penting Saat Slide ke Kiri */}
        {!isSelectionMode && (
          <View style={styles.swipeActionsRow}>
            <TouchableOpacity
              style={[styles.swipeActionBtn, { backgroundColor: '#0EA5E9' }]}
              onPress={() => {
                hapticLight();
                closeSwipe();
                onPlayNext && onPlayNext(song);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="play-skip-forward" size={18} color="#FFFFFF" />
              <Text style={styles.swipeActionLabel}>Berikutnya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.swipeActionBtn, { backgroundColor: '#0284C7' }]}
              onPress={() => {
                hapticLight();
                closeSwipe();
                onToggleFavorite && onToggleFavorite(song.id);
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isFavorite ? 'heart-dislike' : 'heart'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.swipeActionLabel}>
                {isFavorite ? 'Batal Fav' : 'Favorit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.swipeActionBtn, { backgroundColor: theme.danger }]}
              onPress={() => {
                hapticLight();
                closeSwipe();
                if (onRemoveFromPlaylist) {
                  onRemoveFromPlaylist(song.id);
                } else {
                  setConfirmDeleteVisible(true);
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={onRemoveFromPlaylist ? 'remove-circle-outline' : 'trash-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.swipeActionLabel}>
                {onRemoveFromPlaylist ? 'Keluarkan' : 'Hapus'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            backgroundColor: theme.bg,
            transform: [{ translateX }],
          }}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (isSwipedOpenRef.current) {
                closeSwipe();
                return;
              }
              if (isSelectionMode) {
                onToggleSelect && onToggleSelect(song.id);
              } else {
                onPress && onPress();
              }
            }}
            onLongPress={
              !isSelectionMode && onLongPress
                ? () => {
                    if (isSwipedOpenRef.current) closeSwipe();
                    onLongPress(song.id);
                  }
                : undefined
            }
            delayLongPress={320}
            activeOpacity={0.65}
          >
        {isSelectionMode && (
          <View style={{ marginRight: 11 }}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isSelected ? theme.accentStrong : theme.textMuted}
            />
          </View>
        )}

        {/* Artwork Thumbnail Ala Apple Music (46x46 Rounded 9px) */}
        <View
          style={[
            styles.artworkBox,
            {
              backgroundColor: isCurrentSong
                ? theme.accentSoft
                : theme.surfaceElevated,
            },
          ]}
        >
          {hasCover ? (
            <View style={styles.coverThumbWrap}>
              <Image
                source={{ uri: song.coverUri }}
                style={styles.coverThumb}
                resizeMode="cover"
              />
              {isCurrentSong && (
                <View style={styles.playingOverlay}>
                  <Ionicons
                    name={isPlaying ? 'volume-high' : 'pause'}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              )}
            </View>
          ) : (
            <Ionicons
              name={
                isCurrentSong
                  ? isPlaying
                    ? 'volume-high'
                    : 'pause'
                  : 'musical-note'
              }
              size={19}
              color={isCurrentSong ? theme.accent : theme.textMuted}
            />
          )}
        </View>

        {/* Baris Teks dengan Garis Pemisah Tipis (iOS Hairline Divider) */}
        <View
          style={[
            styles.contentBorderBox,
            { borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.infoContainer}>
            <Text
              style={[
                styles.title,
                { color: isCurrentSong ? theme.accent : theme.text },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {song.title}
            </Text>

            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {artistName} • {genreName}
              {hasLyrics ? ' • Lirik' : ''}
            </Text>
          </View>

          {!isSelectionMode && (
          <View style={styles.actions}>
            {isFavorite && (
              <TouchableOpacity
                style={styles.favBtn}
                onPress={() => onToggleFavorite(song.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="heart" size={16} color={theme.accent} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setMenuVisible(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>
          )}
        </View>
      </TouchableOpacity>
      </Animated.View>
      </View>

      {/* iOS Context Sheet */}
      {menuVisible && (
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text
                style={[styles.sheetTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text
                style={[styles.sheetSubtitle, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {artistName} — {song.album || 'Single'}
              </Text>
            </View>

            <View
              style={[
                styles.menuGroup,
                { backgroundColor: theme.surfaceElevated },
              ]}
            >
              {[
                {
                  label: 'Putar Berikutnya',
                  icon: 'play-skip-forward-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onPlayNext && onPlayNext(song);
                  },
                },
                ...(onRemoveFromPlaylist
                  ? [
                      {
                        label: 'Keluarkan dari Playlist ini',
                        icon: 'remove-circle-outline',
                        onPress: () => {
                          setMenuVisible(false);
                          onRemoveFromPlaylist(song.id);
                        },
                      },
                    ]
                  : []),
                {
                  label: isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit',
                  icon: isFavorite ? 'heart-dislike-outline' : 'heart-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onToggleFavorite(song.id);
                  },
                },
                {
                  label: 'Masukkan ke Playlist...',
                  icon: 'list-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    setTimeout(() => setPlaylistModalVisible(true), 280);
                  },
                },
                {
                  label: 'Edit Info Lagu',
                  icon: 'create-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    setTimeout(() => onEdit(song, 'info'), 280);
                  },
                },
                {
                  label: hasCover ? 'Ganti atau Hapus Cover' : 'Pasang Cover Lagu',
                  icon: 'image-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    setTimeout(() => onEdit(song, 'cover'), 280);
                  },
                },
                {
                  label: hasLyrics ? 'Edit Lirik' : 'Tambah Lirik',
                  icon: 'document-text-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    setTimeout(() => onEdit(song, 'lyrics'), 280);
                  },
                },
                {
                  label: 'Rincian File',
                  icon: 'information-circle-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    setTimeout(() => onEdit(song, 'details'), 280);
                  },
                },
              ].map((item, idx, arr) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.sheetOption,
                    idx < arr.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}
                  onPress={item.onPress}
                >
                  <Text style={[styles.sheetOptionText, { color: theme.text }]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.deleteRowBtn,
                { backgroundColor: theme.surfaceElevated },
              ]}
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => setConfirmDeleteVisible(true), 280);
              }}
            >
              <Text style={[styles.sheetOptionText, { color: theme.danger }]}>
                Hapus dari Penyimpanan
              </Text>
              <Ionicons name="trash-outline" size={19} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      )}

      {/* Modal Pilih / Buat Playlist */}
      {playlistModalVisible && (
      <Modal
        visible={playlistModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaylistModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setPlaylistModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.playlistHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                Pilih Playlist
              </Text>
              <TouchableOpacity onPress={() => setPlaylistModalVisible(false)}>
                <Text style={[styles.doneLink, { color: theme.accent }]}>
                  Selesai
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Buat Playlist Baru */}
            <View
              style={[
                styles.newPlaylistRow,
                {
                  backgroundColor: theme.surfaceElevated,
                },
              ]}
            >
              <TextInput
                style={[styles.newPlaylistInput, { color: theme.text }]}
                placeholder="Buat playlist baru..."
                placeholderTextColor={theme.textMuted}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                onSubmitEditing={handleCreateNewPlaylist}
              />
              {newPlaylistName.trim().length > 0 && (
                <TouchableOpacity onPress={handleCreateNewPlaylist}>
                  <Text style={[styles.doneLink, { color: theme.accent }]}>
                    Tambah
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {playlists.length === 0 ? (
              <Text
                style={[
                  styles.emptyPlaylistHint,
                  { color: theme.textSecondary },
                ]}
              >
                Ketik nama playlist di atas untuk membuat playlist pertama Anda.
              </Text>
            ) : (
              <View
                style={[
                  styles.menuGroup,
                  { backgroundColor: theme.surfaceElevated, marginBottom: 4 },
                ]}
              >
                {playlists.map((pl, idx) => {
                  const included = (pl.songIds || []).includes(song.id);
                  return (
                    <TouchableOpacity
                      key={pl.id}
                      style={[
                        styles.sheetOption,
                        idx < playlists.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={() =>
                        onToggleSongInPlaylist &&
                        onToggleSongInPlaylist(pl.id, song.id)
                      }
                    >
                      <Text
                        style={[
                          styles.sheetOptionText,
                          { color: theme.text },
                        ]}
                      >
                        {pl.name}
                      </Text>
                      {included && (
                        <Ionicons
                          name="checkmark"
                          size={19}
                          color={theme.accent}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      )}

      {/* Konfirmasi Hapus (Selaras 100% dengan Design System AppDialog) */}
      {confirmDeleteVisible && (
        <AppDialog
          visible={confirmDeleteVisible}
          title="Hapus Lagu?"
          message={`"${song.title}" akan dihapus permanen dari penyimpanan SoundVault.`}
          type="danger"
          confirmText="Hapus"
          cancelText="Batal"
          theme={theme}
          onCancel={() => setConfirmDeleteVisible(false)}
          onConfirm={() => {
            setConfirmDeleteVisible(false);
            onDelete(song.id);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeActionsRow: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    right: 0,
    width: SWIPE_ACTIONS_WIDTH,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  swipeActionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  swipeActionLabel: {
    fontFamily: CENURA_FONT,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  artworkBox: {
    width: 46,
    height: 46,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
    overflow: 'hidden',
  },
  coverThumbWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  coverThumb: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 132, 199, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBorderBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  title: {
    fontFamily: CENURA_FONT,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favBtn: {
    paddingHorizontal: 6,
  },
  moreBtn: {
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetHeader: {
    paddingBottom: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 15.5,
    fontWeight: '600',
  },
  sheetSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  menuGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sheetOptionText: {
    fontSize: 14.5,
    fontWeight: '400',
  },
  deleteRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  playlistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  doneLink: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 12,
  },
  newPlaylistInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  emptyPlaylistHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 14,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmTitle: {
    fontSize: 16.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  confirmText: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 18,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  confirmCancelText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  confirmDelete: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '600',
  },
});

export default memo(SongItem);
