import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';

function SongItem({
  song,
  theme,
  isPlaying,
  isCurrentSong,
  isFavorite,
  playlists = [],
  onPress,
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
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.65}
      >
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
        </View>
      </TouchableOpacity>

      {/* iOS Context Sheet */}
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
                    setPlaylistModalVisible(true);
                  },
                },
                {
                  label: 'Edit Info Lagu',
                  icon: 'create-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onEdit(song, 'info');
                  },
                },
                {
                  label: hasCover ? 'Ganti atau Hapus Cover' : 'Pasang Cover Lagu',
                  icon: 'image-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onEdit(song, 'cover');
                  },
                },
                {
                  label: hasLyrics ? 'Edit Lirik' : 'Tambah Lirik',
                  icon: 'document-text-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onEdit(song, 'lyrics');
                  },
                },
                {
                  label: 'Rincian File',
                  icon: 'information-circle-outline',
                  onPress: () => {
                    setMenuVisible(false);
                    onEdit(song, 'details');
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
                setConfirmDeleteVisible(true);
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

      {/* Modal Pilih / Buat Playlist */}
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

      {/* Konfirmasi Hapus */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: theme.text }]}>
              Hapus Lagu?
            </Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              &quot;{song.title}&quot; akan dihapus permanen dari pustaka Anda.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text
                  style={[
                    styles.confirmCancelText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, { backgroundColor: theme.danger }]}
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  onDelete(song.id);
                }}
              >
                <Text style={styles.confirmDeleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
