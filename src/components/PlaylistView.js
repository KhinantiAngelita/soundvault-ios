import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntigravityLogo from './AntigravityLogo';
import SongItem from './SongItem';
import SongPickerModal from './SongPickerModal';
import { CENURA_FONT } from '../utils/theme';
import { pickCoverImageFromDevice } from '../services/storageService';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';

/**
 * Tampilan Khusus Tab Playlist:
 * - Kartu Playlist bergaya Apple Music / Carousel Card (kotak cover + judul & jumlah lagu di bawah)
 * - Buat Playlist langsung dari tombol "+ Buat Playlist" (tidak perlu klik lagu dulu)
 * - Pilih banyak lagu sekaligus saat membuat atau mengelola Playlist
 */
export default function PlaylistView({
  playlists = [],
  songs = [],
  favorites = [],
  theme,
  playerStatus,
  onCreatePlaylistWithSongs,
  onSetPlaylistSongs,
  onUpdatePlaylistInfo,
  onDeletePlaylist,
  onPlaySong,
  onPlayAll,
  onPlayNext,
  onToggleFavorite,
  onToggleSongInPlaylist,
  onCreatePlaylist,
  onEditSong,
  onDeleteSong,
}) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlCover, setNewPlCover] = useState(null);
  const [newPlSongIds, setNewPlSongIds] = useState([]);
  const [isPickerForCreate, setIsPickerForCreate] = useState(false);
  const [isPickerForDetail, setIsPickerForDetail] = useState(false);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const getPlaylistCover = (pl) => {
    if (pl.coverUri) return pl.coverUri;
    const plSongs = songs.filter((s) => (pl.songIds || []).includes(s.id));
    const withCover = plSongs.find((s) => s.coverUri);
    return withCover ? withCover.coverUri : null;
  };

  const handlePickNewPlaylistCover = async () => {
    const res = await pickCoverImageFromDevice();
    if (res.success && res.coverUri) {
      setNewPlCover(res.coverUri);
    }
  };

  const handleConfirmCreatePlaylist = async () => {
    const clean = newPlName.trim();
    if (!clean) {
      Alert.alert('Nama Kosong', 'Masukkan nama playlist terlebih dahulu.');
      return;
    }
    hapticSuccess();
    await onCreatePlaylistWithSongs(clean, newPlSongIds, newPlCover);
    setNewPlName('');
    setNewPlCover(null);
    setNewPlSongIds([]);
    setIsCreateModalVisible(false);
  };

  const handleConfirmDeletePlaylist = (pl) => {
    if (Platform.OS === 'web') {
      onDeletePlaylist(pl.id);
      if (selectedPlaylistId === pl.id) setSelectedPlaylistId(null);
      return;
    }
    Alert.alert(
      'Hapus Playlist?',
      `Playlist "${pl.name}" akan dihapus. File lagu di pustaka tetap aman.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            onDeletePlaylist(pl.id);
            if (selectedPlaylistId === pl.id) setSelectedPlaylistId(null);
          },
        },
      ]
    );
  };

  const handleChangeActiveCover = async () => {
    if (!activePlaylist) return;
    const res = await pickCoverImageFromDevice();
    if (res.success && res.coverUri) {
      hapticSuccess();
      onUpdatePlaylistInfo(activePlaylist.id, { coverUri: res.coverUri });
    }
  };

  // === HALAMAN DETAIL PLAYLIST ===
  if (activePlaylist) {
    const plSongs = songs.filter((s) => (activePlaylist.songIds || []).includes(s.id));
    const coverUri = getPlaylistCover(activePlaylist);

    return (
      <View style={styles.container}>
        {/* Top Bar Kembali */}
        <View style={styles.detailTopBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              hapticSelection();
              setSelectedPlaylistId(null);
            }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
            <Text style={[styles.backText, { color: theme.accent }]}>Playlist</Text>
          </TouchableOpacity>

          <View style={styles.detailTopRight}>
            <TouchableOpacity
              style={[styles.iconCircleBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={handleChangeActiveCover}
            >
              <Ionicons name="image-outline" size={17} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconCircleBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => handleConfirmDeletePlaylist(activePlaylist)}
            >
              <Ionicons name="trash-outline" size={17} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={plSongs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.detailListContent,
            playerStatus.currentSong ? { paddingBottom: 120 } : { paddingBottom: 24 },
          ]}
          ListHeaderComponent={
            <View style={styles.detailHero}>
              {/* Kartu Cover Bergaya Foto Referensi */}
              <View
                style={[
                  styles.heroCardFrame,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroArtworkBox,
                    { backgroundColor: theme.surfaceElevated },
                  ]}
                >
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.fullImg} resizeMode="cover" />
                  ) : (
                    <AntigravityLogo size={54} theme={theme} />
                  )}
                </View>
                <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>
                  {activePlaylist.name}
                </Text>
                <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
                  {plSongs.length} Lagu
                </Text>
              </View>

              {/* Tombol Aksi: Putar | Acak | + Pilih Lagu */}
              <View style={styles.detailActionRow}>
                {plSongs.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceElevated }]}
                      onPress={() => {
                        hapticLight();
                        onPlayAll(plSongs, false);
                      }}
                    >
                      <Ionicons name="play" size={15} color={theme.accent} />
                      <Text style={[styles.actionBtnText, { color: theme.accent }]}>
                        Putar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceElevated }]}
                      onPress={() => {
                        hapticLight();
                        onPlayAll(plSongs, true);
                      }}
                    >
                      <Ionicons name="shuffle" size={15} color={theme.accent} />
                      <Text style={[styles.actionBtnText, { color: theme.accent }]}>
                        Acak
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.accentStrong }]}
                  onPress={() => {
                    hapticSelection();
                    setIsPickerForDetail(true);
                  }}
                >
                  <Ionicons name="add" size={17} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                    Pilih Lagu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyPlaylistInner}>
              <Text style={[styles.emptySubText, { color: theme.textMuted }]}>
                Playlist ini masih kosong. Ketuk "Pilih Lagu" untuk memasukkan banyak lagu sekaligus.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <SongItem
              song={item}
              theme={theme}
              isPlaying={playerStatus.isPlaying}
              isCurrentSong={playerStatus.currentSong?.id === item.id}
              isFavorite={favorites.includes(item.id)}
              playlists={playlists}
              onPress={() => onPlaySong(item, index, plSongs)}
              onPlayNext={onPlayNext}
              onToggleFavorite={onToggleFavorite}
              onToggleSongInPlaylist={onToggleSongInPlaylist}
              onCreatePlaylist={onCreatePlaylist}
              onEdit={onEditSong}
              onDelete={onDeleteSong}
            />
          )}
        />

        {isPickerForDetail && (
          <SongPickerModal
            visible={isPickerForDetail}
            title={`Isi "${activePlaylist.name}"`}
            subtitle="Centang lagu yang ingin dimasukkan"
            songs={songs}
            initialSelectedIds={activePlaylist.songIds || []}
            theme={theme}
            onClose={() => setIsPickerForDetail(false)}
            onConfirm={(ids) => onSetPlaylistSongs(activePlaylist.id, ids)}
          />
        )}
      </View>
    );
  }

  // === HALAMAN UTAMA PLAYLIST (KARTU CAROUSEL & GRID ALA REFERENSI) ===
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.hubContent,
          playerStatus.currentSong ? { paddingBottom: 120 } : { paddingBottom: 28 },
        ]}
      >
        {/* Header Baris Playlist + Tombol Buat Playlist Langsung */}
        <View style={styles.hubHeader}>
          <View>
            <Text style={[styles.hubTitle, { color: theme.text }]}>Playlist</Text>
            <Text style={[styles.hubCount, { color: theme.textMuted }]}>
              {playlists.length} koleksi pribadi
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: theme.accentStrong }]}
            onPress={() => {
              hapticSelection();
              setNewPlName('');
              setNewPlCover(null);
              setNewPlSongIds([]);
              setIsCreateModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Buat Playlist</Text>
          </TouchableOpacity>
        </View>

        {playlists.length === 0 ? (
          <View style={styles.emptyHub}>
            <View
              style={[
                styles.emptyCardPreview,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyArtwork,
                  { backgroundColor: theme.surfaceElevated },
                ]}
              >
                <AntigravityLogo size={42} theme={theme} />
              </View>
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>
                Belum Ada Playlist
              </Text>
              <Text style={[styles.emptyCardSub, { color: theme.textSecondary }]}>
                Buat playlist dulu, lalu langsung pilih banyak lagu sekaligus tanpa ribet.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Carousel Kartu Besar (Persis Proporsi & Gaya Foto Referensi) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScroll}
              decelerationRate="fast"
            >
              {playlists.map((pl) => {
                const coverUri = getPlaylistCover(pl);
                const count = (pl.songIds || []).length;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={[
                      styles.playlistCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        shadowColor: theme.mode === 'light' ? '#0F172A' : '#000000',
                      },
                    ]}
                    onPress={() => {
                      hapticLight();
                      setSelectedPlaylistId(pl.id);
                    }}
                    onLongPress={() => handleConfirmDeletePlaylist(pl)}
                    activeOpacity={0.86}
                  >
                    <View
                      style={[
                        styles.cardArtworkWrap,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                    >
                      {coverUri ? (
                        <Image
                          source={{ uri: coverUri }}
                          style={styles.fullImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <AntigravityLogo size={54} theme={theme} />
                      )}
                    </View>
                    <View style={styles.cardFooter}>
                      <Text
                        style={[styles.cardTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {pl.name}
                      </Text>
                      <Text
                        style={[styles.cardSubtitle, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {count} Lagu
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Daftar Ringkas Semua Playlist di Bawahnya */}
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              SEMUA PLAYLIST
            </Text>
            <View
              style={[
                styles.listGroup,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {playlists.map((pl, idx) => {
                const coverUri = getPlaylistCover(pl);
                const count = (pl.songIds || []).length;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={[
                      styles.compactRow,
                      idx < playlists.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      hapticLight();
                      setSelectedPlaylistId(pl.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.compactThumb,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                    >
                      {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.fullImg} />
                      ) : (
                        <Ionicons name="albums-outline" size={18} color={theme.accent} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>
                        {pl.name}
                      </Text>
                      <Text style={[styles.compactMeta, { color: theme.textMuted }]}>
                        {count} Lagu
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Buat Playlist Baru (Nama + Cover + Multi-Select Lagu Langsung!) */}
      {isCreateModalVisible && (
        <Modal
          visible={isCreateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCreateModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View
              style={[
                styles.createCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                  <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>
                    Batal
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Playlist Baru
                </Text>
                <TouchableOpacity onPress={handleConfirmCreatePlaylist}>
                  <Text style={[styles.modalDone, { color: theme.accent }]}>
                    Buat
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cover Picker */}
              <TouchableOpacity
                style={[
                  styles.coverPickBox,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handlePickNewPlaylistCover}
                activeOpacity={0.8}
              >
                {newPlCover ? (
                  <Image source={{ uri: newPlCover }} style={styles.fullImg} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={28} color={theme.accent} />
                    <Text style={[styles.coverPickHint, { color: theme.textMuted }]}>
                      Cover (Opsional)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Nama playlist (misal: Chill Malam)"
                placeholderTextColor={theme.textMuted}
                value={newPlName}
                onChangeText={setNewPlName}
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.pickSongsBtn,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.accentBorder,
                  },
                ]}
                onPress={() => {
                  setIsCreateModalVisible(false);
                  setTimeout(() => setIsPickerForCreate(true), 280);
                }}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={theme.accent} />
                <Text style={[styles.pickSongsText, { color: theme.accent }]}>
                  {newPlSongIds.length > 0
                    ? `${newPlSongIds.length} Lagu Dipilih (Ubah)`
                    : 'Pilih Lagu Sekarang (Opsional)'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {isPickerForCreate && (
        <SongPickerModal
          visible={isPickerForCreate}
          title="Pilih Lagu untuk Playlist"
          subtitle={newPlName.trim() || 'Playlist Baru'}
          songs={songs}
          initialSelectedIds={newPlSongIds}
          theme={theme}
          onClose={() => {
            setIsPickerForCreate(false);
            setTimeout(() => setIsCreateModalVisible(true), 280);
          }}
          onConfirm={(ids) => {
            setNewPlSongIds(ids);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hubContent: {
    paddingTop: 4,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  hubTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  hubCount: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
  },
  createBtnText: {
    fontFamily: CENURA_FONT,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  carouselScroll: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 14,
  },
  playlistCard: {
    width: 196,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardArtworkWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  cardTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: CENURA_FONT,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
  },
  listGroup: {
    marginHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  compactThumb: {
    width: 42,
    height: 42,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  compactName: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    fontWeight: '500',
  },
  compactMeta: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 1,
  },
  emptyHub: {
    paddingHorizontal: 28,
    paddingTop: 24,
    alignItems: 'center',
  },
  emptyCardPreview: {
    width: '100%',
    maxWidth: 270,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyArtwork: {
    width: 140,
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyCardTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 16.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyCardSub: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  detailTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 10,
  },
  backText: {
    fontFamily: CENURA_FONT,
    fontSize: 15,
    fontWeight: '500',
  },
  detailTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailListContent: {
    paddingHorizontal: 18,
  },
  detailHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCardFrame: {
    width: 210,
    borderRadius: 22,
    padding: 9,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroArtworkBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 4,
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 9,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  actionBtnText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyPlaylistInner: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptySubText: {
    fontFamily: CENURA_FONT,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  createCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCancel: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
  },
  modalTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDone: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    fontWeight: '600',
  },
  coverPickBox: {
    width: 112,
    height: 112,
    borderRadius: 16,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 14,
  },
  coverPickHint: {
    fontFamily: CENURA_FONT,
    fontSize: 11,
    marginTop: 4,
  },
  nameInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  pickSongsBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  pickSongsText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '600',
  },
});
