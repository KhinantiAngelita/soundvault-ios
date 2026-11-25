import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getStoredSongs,
  saveSongsMetadata,
  importSongFromDevice,
  deleteSong,
  updateSongMetadata,
  getFavorites,
  toggleFavoriteSong,
  getSavedThemeMode,
  saveThemeMode,
} from './src/services/storageService';
import { audioPlayer } from './src/services/audioService';
import { generateDemoSongs } from './src/utils/demoSongs';
import { THEMES } from './src/utils/theme';
import AntigravityLogo from './src/components/AntigravityLogo';
import SongItem from './src/components/SongItem';
import MiniPlayer from './src/components/MiniPlayer';
import PlayerModal from './src/components/PlayerModal';
import RenameModal from './src/components/RenameModal';

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const theme = THEMES[themeMode] || THEMES.dark;

  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'artists' | 'genres' | 'favorites'
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Player State
  const [playerStatus, setPlayerStatus] = useState({
    currentSong: null,
    isPlaying: false,
    duration: 0,
    position: 0,
    repeatMode: 'off',
    isShuffle: false,
  });
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);

  useEffect(() => {
    loadInitialData();

    const unsubStatus = audioPlayer.subscribeStatus((status) => {
      setPlayerStatus(status);
    });

    return () => {
      unsubStatus();
    };
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [stored, favs, savedMode] = await Promise.all([
        getStoredSongs(),
        getFavorites(),
        getSavedThemeMode(),
      ]);
      setSongs(stored);
      setFavorites(favs);
      setThemeMode(savedMode);
    } catch (e) {
      console.error('Error load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTheme = async () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    await saveThemeMode(nextMode);
  };

  const handleImportSongs = async () => {
    setIsImporting(true);
    try {
      const result = await importSongFromDevice();
      if (result.success) {
        setSongs(result.songs);
        if (Platform.OS !== 'web') {
          Alert.alert('Tersimpan', `${result.count} lagu ditambahkan ke penyimpanan.`);
        }
      } else if (result.error) {
        Alert.alert('Gagal Mengimpor', result.error);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadDemoSongs = async () => {
    const demoTracks = generateDemoSongs();
    const existingIds = new Set(songs.map((s) => s.id));
    const newTracks = demoTracks.filter((d) => !existingIds.has(d.id));
    const updated = [...newTracks, ...songs];
    setSongs(updated);
    await saveSongsMetadata(updated);
  };

  const handlePlaySong = async (song, index, customQueue = null) => {
    const listToPlay = customQueue || displayedSongs;
    await audioPlayer.playSong(song, listToPlay, index);
  };

  const handleToggleFavorite = async (songId) => {
    const updated = await toggleFavoriteSong(songId);
    setFavorites(updated);
  };

  const handleDeleteSong = async (songId) => {
    try {
      if (playerStatus.currentSong?.id === songId) {
        await audioPlayer.nextSong();
      }
      const updated = await deleteSong(songId);
      setSongs(updated);
    } catch (err) {
      Alert.alert('Error', 'Gagal menghapus lagu.');
    }
  };

  const handleSaveMetadata = async (songId, updates) => {
    try {
      const updated = await updateSongMetadata(songId, updates);
      setSongs(updated);
      if (playerStatus.currentSong?.id === songId) {
        setPlayerStatus((prev) => ({
          ...prev,
          currentSong: {
            ...prev.currentSong,
            ...updates,
          },
        }));
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan perubahan info lagu.');
    }
  };

  // Daftar grup Artist unik beserta jumlah lagunya
  const artistGroups = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      const artist = s.artist || 'Unknown Artist';
      if (!map[artist]) map[artist] = [];
      map[artist].push(s);
    });
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, count: map[name].length, songs: map[name] }));
  }, [songs]);

  // Daftar grup Genre unik beserta jumlah lagunya
  const genreGroups = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      const genre = s.genre || 'Pop';
      if (!map[genre]) map[genre] = [];
      map[genre].push(s);
    });
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, count: map[name].length, songs: map[name] }));
  }, [songs]);

  // Filter lagu berdasarkan tab, sub-pilihan artist/genre, dan pencarian
  const displayedSongs = useMemo(() => {
    return songs.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'favorites') {
        return favorites.includes(s.id);
      }
      if (activeTab === 'artists' && selectedArtist) {
        return (s.artist || 'Unknown Artist') === selectedArtist;
      }
      if (activeTab === 'genres' && selectedGenre) {
        return (s.genre || 'Pop') === selectedGenre;
      }
      return true;
    });
  }, [songs, searchQuery, activeTab, favorites, selectedArtist, selectedGenre]);

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey !== 'artists') setSelectedArtist(null);
    if (tabKey !== 'genres') setSelectedGenre(null);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.outerBackground, { backgroundColor: theme.outerBg }]}>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />

        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Top Header Minimalis */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <AntigravityLogo size={36} theme={theme} />
              <Text style={[styles.appTitle, { color: theme.text }]}>
                SoundVault
              </Text>
            </View>

            <View style={styles.headerRight}>
              {/* Toggle Mode Hitam / Putih */}
              <TouchableOpacity
                style={[
                  styles.themeToggleBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleToggleTheme}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={themeMode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={theme.accent}
                />
              </TouchableOpacity>

              {/* Tombol Tambah Lagu */}
              <TouchableOpacity
                style={[
                  styles.importBtn,
                  {
                    backgroundColor: theme.accentStrong,
                    shadowColor: theme.accentStrong,
                  },
                ]}
                onPress={handleImportSongs}
                disabled={isImporting}
                activeOpacity={0.85}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.importBtnText}>Tambah</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar Minimalis */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={17}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cari lagu, artist, atau genre..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Navigasi Tab (Semua, Artist, Genre, Favorit) */}
          <View style={styles.tabWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContainer}
            >
              {[
                { key: 'all', label: `Semua (${songs.length})`, icon: 'musical-notes-outline' },
                { key: 'artists', label: `Artist (${artistGroups.length})`, icon: 'person-outline' },
                { key: 'genres', label: `Genre (${genreGroups.length})`, icon: 'pricetag-outline' },
                { key: 'favorites', label: `Favorit (${favorites.length})`, icon: 'heart-outline' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tabBtn,
                      {
                        backgroundColor: isActive ? theme.accentStrong : theme.surface,
                        borderColor: isActive ? theme.accentStrong : theme.border,
                      },
                    ]}
                    onPress={() => handleSelectTab(tab.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={14}
                      color={isActive ? '#FFFFFF' : theme.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        { color: isActive ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Sub-Filter Pill ketika di Tab Artist */}
          {activeTab === 'artists' && artistGroups.length > 0 && (
            <View style={styles.subFilterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subFilterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.subChip,
                    {
                      backgroundColor: !selectedArtist ? theme.accentSoft : theme.surface,
                      borderColor: !selectedArtist ? theme.accentBorder : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedArtist(null)}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      { color: !selectedArtist ? theme.accent : theme.textSecondary },
                    ]}
                  >
                    Semua Artist
                  </Text>
                </TouchableOpacity>

                {artistGroups.map((group) => {
                  const active = selectedArtist === group.name;
                  return (
                    <TouchableOpacity
                      key={group.name}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: active ? theme.accentSoft : theme.surface,
                          borderColor: active ? theme.accentBorder : theme.border,
                        },
                      ]}
                      onPress={() =>
                        setSelectedArtist(active ? null : group.name)
                      }
                    >
                      <Text
                        style={[
                          styles.subChipText,
                          { color: active ? theme.accent : theme.textSecondary },
                        ]}
                      >
                        {group.name} ({group.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Sub-Filter Pill ketika di Tab Genre */}
          {activeTab === 'genres' && genreGroups.length > 0 && (
            <View style={styles.subFilterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subFilterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.subChip,
                    {
                      backgroundColor: !selectedGenre ? theme.accentSoft : theme.surface,
                      borderColor: !selectedGenre ? theme.accentBorder : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedGenre(null)}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      { color: !selectedGenre ? theme.accent : theme.textSecondary },
                    ]}
                  >
                    Semua Genre
                  </Text>
                </TouchableOpacity>

                {genreGroups.map((group) => {
                  const active = selectedGenre === group.name;
                  return (
                    <TouchableOpacity
                      key={group.name}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: active ? theme.accentSoft : theme.surface,
                          borderColor: active ? theme.accentBorder : theme.border,
                        },
                      ]}
                      onPress={() =>
                        setSelectedGenre(active ? null : group.name)
                      }
                    >
                      <Text
                        style={[
                          styles.subChipText,
                          { color: active ? theme.accent : theme.textSecondary },
                        ]}
                      >
                        {group.name} ({group.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Konten Daftar Lagu */}
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.accentStrong} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Memuat pustaka musik...
              </Text>
            </View>
          ) : displayedSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={activeTab === 'favorites' ? 'heart-outline' : 'disc-outline'}
                  size={42}
                  color={theme.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeTab === 'favorites'
                  ? 'Belum Ada Lagu Favorit'
                  : searchQuery
                  ? 'Tidak Ditemukan'
                  : 'Pustaka Masih Kosong'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {activeTab === 'favorites'
                  ? 'Ketuk ikon hati pada lagu untuk menyimpannya di tab Favorit.'
                  : searchQuery
                  ? `Tidak ada lagu, artist, atau genre yang cocok dengan "${searchQuery}".`
                  : 'Ketuk tombol "+ Tambah" di kanan atas untuk mengimpor lagu dari perangkat Anda.'}
              </Text>

              {songs.length === 0 && !searchQuery && (
                <TouchableOpacity
                  style={[
                    styles.demoBtn,
                    {
                      backgroundColor: theme.accentSoft,
                      borderColor: theme.accentBorder,
                    },
                  ]}
                  onPress={handleLoadDemoSongs}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles-outline" size={16} color={theme.accent} />
                  <Text style={[styles.demoBtnText, { color: theme.accent }]}>
                    Muat 4 Lagu Contoh (Artist & Genre)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={displayedSongs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                playerStatus.currentSong ? { paddingBottom: 110 } : { paddingBottom: 30 },
              ]}
              renderItem={({ item, index }) => (
                <SongItem
                  song={item}
                  theme={theme}
                  isPlaying={playerStatus.isPlaying}
                  isCurrentSong={playerStatus.currentSong?.id === item.id}
                  isFavorite={favorites.includes(item.id)}
                  onPress={() => handlePlaySong(item, index)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(song) => setSongToEdit(song)}
                  onDelete={handleDeleteSong}
                />
              )}
            />
          )}

          {/* Mini Player Melayang di Bawah */}
          <MiniPlayer
            currentSong={playerStatus.currentSong}
            theme={theme}
            isPlaying={playerStatus.isPlaying}
            position={playerStatus.position}
            duration={playerStatus.duration}
            onPress={() => setIsPlayerModalVisible(true)}
            onTogglePlayPause={() => audioPlayer.togglePlayPause()}
            onNext={() => audioPlayer.nextSong()}
          />

          {/* Modal Player Layar Penuh */}
          <PlayerModal
            visible={isPlayerModalVisible}
            onClose={() => setIsPlayerModalVisible(false)}
            currentSong={playerStatus.currentSong}
            theme={theme}
            isPlaying={playerStatus.isPlaying}
            duration={playerStatus.duration}
            position={playerStatus.position}
            repeatMode={playerStatus.repeatMode}
            isShuffle={playerStatus.isShuffle}
            isFavorite={
              playerStatus.currentSong
                ? favorites.includes(playerStatus.currentSong.id)
                : false
            }
            onTogglePlayPause={() => audioPlayer.togglePlayPause()}
            onNext={() => audioPlayer.nextSong()}
            onPrevious={() => audioPlayer.previousSong()}
            onSeek={(val) => audioPlayer.seekTo(val)}
            onToggleRepeat={() => audioPlayer.toggleRepeatMode()}
            onToggleShuffle={() => audioPlayer.toggleShuffle()}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Modal Edit Judul, Artist, & Genre */}
          <RenameModal
            visible={!!songToEdit}
            song={songToEdit}
            theme={theme}
            onClose={() => setSongToEdit(null)}
            onSave={handleSaveMetadata}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : '100%',
    alignSelf: 'center',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    paddingHorizontal: 13,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  tabWrapper: {
    marginBottom: 10,
  },
  tabContainer: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  subFilterWrapper: {
    marginBottom: 10,
  },
  subFilterScroll: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 7,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13.5,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: -24,
  },
  emptyIconBox: {
    width: 74,
    height: 74,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
