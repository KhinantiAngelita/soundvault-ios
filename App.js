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
  getSavedSortOrder,
  saveSortOrder,
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  toggleSongInPlaylist,
  getLastPlayedSongId,
  saveLastPlayedSongId,
} from './src/services/storageService';
import * as Font from 'expo-font';
import { audioPlayer } from './src/services/audioService';
import { THEMES, CENURA_FONT } from './src/utils/theme';
import AntigravityLogo from './src/components/AntigravityLogo';
import SongItem from './src/components/SongItem';
import MiniPlayer from './src/components/MiniPlayer';
import PlayerModal from './src/components/PlayerModal';
import RenameModal from './src/components/RenameModal';
import SettingsModal from './src/components/SettingsModal';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const theme = THEMES[themeMode] || THEMES.dark;

  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'artists' | 'genres' | 'playlists' | 'favorites'
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Player State
  const [playerStatus, setPlayerStatus] = useState({
    currentSong: null,
    isPlaying: false,
    duration: 0,
    position: 0,
    repeatMode: 'off',
    isShuffle: false,
    playbackRate: 1.0,
    sleepTimerMinutes: 0,
    sleepTimerRemainingSec: 0,
  });
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);
  const [editorInitialTab, setEditorInitialTab] = useState('info');

  const handleOpenEditor = (song, tabKey = 'info') => {
    setEditorInitialTab(tabKey);
    if (isPlayerModalVisible) {
      setIsPlayerModalVisible(false);
      setTimeout(() => {
        setSongToEdit(song);
      }, 350);
    } else {
      setSongToEdit(song);
    }
  };

  useEffect(() => {
    // Load font geometris bergaya Cenura untuk iOS Native & Web
    Font.loadAsync({
      CenuraGeometric: require('./assets/fonts/CenuraGeometric.ttf'),
    }).catch(() => {});

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('cenura-font-link')) {
        const link = document.createElement('link');
        link.id = 'cenura-font-link';
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.innerHTML = `
          body, input, textarea {
            font-family: 'Outfit', 'CenuraGeometric', -apple-system, BlinkMacSystemFont, sans-serif !important;
            -webkit-font-smoothing: antialiased;
          }
        `;
        document.head.appendChild(style);
      }
    }

    loadInitialData();

    const unsubStatus = audioPlayer.subscribeStatus((status) => {
      setPlayerStatus(status);
    });

    const unsubSongChange = audioPlayer.subscribeSongChange((song) => {
      if (song?.id) {
        saveLastPlayedSongId(song.id);
      }
    });

    return () => {
      unsubStatus();
      unsubSongChange();
    };
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [stored, favs, savedMode, savedSort, storedPlaylists, lastSongId] =
        await Promise.all([
          getStoredSongs(),
          getFavorites(),
          getSavedThemeMode(),
          getSavedSortOrder(),
          getPlaylists(),
          getLastPlayedSongId(),
        ]);
      setSongs(stored);
      setFavorites(favs);
      setThemeMode(savedMode);
      setSortOrder(savedSort);
      setPlaylists(storedPlaylists);

      // Otomatis tampilkan lagu terakhir di MiniPlayer saat aplikasi dibuka
      if (lastSongId && stored.length > 0) {
        const lastSong = stored.find((s) => s.id === lastSongId);
        if (lastSong) {
          audioPlayer.preloadSong(lastSong, stored);
        }
      }
    } catch (e) {
      console.error('Error load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTheme = async (mode) => {
    setThemeMode(mode);
    await saveThemeMode(mode);
  };

  const handleSelectSortOrder = async (newSort) => {
    setSortOrder(newSort);
    await saveSortOrder(newSort);
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

  const handlePlaySong = async (song, index, customQueue = null) => {
    const listToPlay = customQueue || displayedSongs;
    await audioPlayer.playSong(song, listToPlay, index);
  };

  const handleToggleFavorite = async (songId) => {
    const updated = await toggleFavoriteSong(songId);
    setFavorites(updated);
  };

  const handleCreatePlaylist = async (name, initialSongId = null) => {
    let updated = await createPlaylist(name);
    if (initialSongId && updated.length > 0) {
      const newestPl = updated[updated.length - 1];
      updated = await toggleSongInPlaylist(newestPl.id, initialSongId);
    }
    setPlaylists(updated);
  };

  const handleToggleSongInPlaylist = async (playlistId, songId) => {
    const updated = await toggleSongInPlaylist(playlistId, songId);
    setPlaylists(updated);
  };

  const handleDeletePlaylist = async (playlistId) => {
    const updated = await deletePlaylist(playlistId);
    setPlaylists(updated);
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      const updated = await deleteSong(songId);
      setSongs(updated);
      const updatedPlaylists = await getPlaylists();
      setPlaylists(updatedPlaylists);

      if (playerStatus.currentSong?.id === songId) {
        audioPlayer.removeSongFromQueue(songId);
        if (updated.length > 0 && audioPlayer.queue.length > 0) {
          await audioPlayer.nextSong();
        } else {
          audioPlayer.stopAndClear();
          setIsPlayerModalVisible(false);
        }
      } else {
        audioPlayer.removeSongFromQueue(songId);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal menghapus lagu.');
    }
  };

  const handleSaveMetadata = async (songId, updates) => {
    try {
      const updated = await updateSongMetadata(songId, updates);
      setSongs(updated);
      audioPlayer.updateSongInMemory(songId, updates);
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan perubahan info lagu.');
    }
  };

  // Daftar grup Artist unik
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

  // Daftar grup Genre unik
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

  const totalStorageBytes = useMemo(() => {
    return songs.reduce((acc, s) => acc + (Number(s.size) || 0), 0);
  }, [songs]);

  // Filter & Sorting lagu
  const displayedSongs = useMemo(() => {
    const activePl =
      activeTab === 'playlists' && selectedPlaylistId
        ? playlists.find((p) => p.id === selectedPlaylistId)
        : null;

    const filtered = songs.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q);

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
      if (activeTab === 'playlists' && activePl) {
        return (activePl.songIds || []).includes(s.id);
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortOrder === 'za') {
        return (b.title || '').localeCompare(a.title || '');
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortOrder === 'oldest') {
        return timeA - timeB;
      }
      return timeB - timeA;
    });
  }, [
    songs,
    searchQuery,
    activeTab,
    favorites,
    selectedArtist,
    selectedGenre,
    selectedPlaylistId,
    playlists,
    sortOrder,
  ]);

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey !== 'artists') setSelectedArtist(null);
    if (tabKey !== 'genres') setSelectedGenre(null);
    if (tabKey !== 'playlists') setSelectedPlaylistId(null);
  };

  // Halaman Splash Screen Tersendiri (Terpisah Penuh dari Landing Page)
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />
        <SplashScreen
          visible={showSplash}
          theme={theme}
          onFinish={() => setShowSplash(false)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.outerBackground, { backgroundColor: theme.bg }]}
        edges={['top']}
      >
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
              <AntigravityLogo size={28} theme={theme} />
              <Text style={[styles.appTitle, { color: theme.text }]}>
                SoundVault
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[
                  styles.plusIconBtn,
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
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingsIconBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setIsSettingsVisible(true)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="settings-outline"
                  size={19}
                  color={theme.textSecondary}
                />
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

          {/* Navigasi Tab Bersih (Semua, Artist, Genre, Playlist, Favorit) */}
          <View style={styles.tabWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContainer}
            >
              {[
                { key: 'all', label: 'Semua' },
                { key: 'artists', label: 'Artist' },
                { key: 'genres', label: 'Genre' },
                { key: 'playlists', label: 'Playlist' },
                { key: 'favorites', label: 'Favorit' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tabBtn,
                      {
                        backgroundColor: isActive
                          ? theme.accent
                          : theme.surfaceElevated,
                      },
                    ]}
                    onPress={() => handleSelectTab(tab.key)}
                    activeOpacity={0.8}
                  >
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
                        {group.name}
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
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Sub-Filter Pill ketika di Tab Playlist */}
          {activeTab === 'playlists' && (
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
                      backgroundColor: !selectedPlaylistId
                        ? theme.accentSoft
                        : theme.surface,
                      borderColor: !selectedPlaylistId
                        ? theme.accentBorder
                        : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedPlaylistId(null)}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      {
                        color: !selectedPlaylistId
                          ? theme.accent
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    Semua
                  </Text>
                </TouchableOpacity>

                {playlists.map((pl) => {
                  const active = selectedPlaylistId === pl.id;
                  return (
                    <TouchableOpacity
                      key={pl.id}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: active
                            ? theme.accentSoft
                            : theme.surface,
                          borderColor: active
                            ? theme.accentBorder
                            : theme.border,
                        },
                      ]}
                      onPress={() =>
                        setSelectedPlaylistId(active ? null : pl.id)
                      }
                      onLongPress={() => handleDeletePlaylist(pl.id)}
                    >
                      <Text
                        style={[
                          styles.subChipText,
                          {
                            color: active
                              ? theme.accent
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {pl.name}
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
                  size={40}
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
                  ? `Tidak ada lagu yang cocok dengan "${searchQuery}".`
                  : 'Ketuk tombol "+" di kanan atas untuk mengimpor lagu dari perangkat Anda.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayedSongs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                playerStatus.currentSong ? { paddingBottom: 110 } : { paddingBottom: 30 },
              ]}
              ListHeaderComponent={
                displayedSongs.length > 1 ? (
                  <View style={styles.quickActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.quickPlayBtn,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                      onPress={() => audioPlayer.playAll(displayedSongs, false)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="play" size={15} color={theme.accent} />
                      <Text style={[styles.quickPlayText, { color: theme.accent }]}>
                        Putar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quickPlayBtn,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                      onPress={() => audioPlayer.playAll(displayedSongs, true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="shuffle" size={16} color={theme.accent} />
                      <Text style={[styles.quickPlayText, { color: theme.accent }]}>
                        Acak
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              }
              renderItem={({ item, index }) => (
                <SongItem
                  song={item}
                  theme={theme}
                  isPlaying={playerStatus.isPlaying}
                  isCurrentSong={playerStatus.currentSong?.id === item.id}
                  isFavorite={favorites.includes(item.id)}
                  playlists={playlists}
                  onPress={() => handlePlaySong(item, index)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleSongInPlaylist={handleToggleSongInPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  onEdit={(song, tabKey) => handleOpenEditor(song, tabKey)}
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
            queue={displayedSongs}
            theme={theme}
            isPlaying={playerStatus.isPlaying}
            duration={playerStatus.duration}
            position={playerStatus.position}
            repeatMode={playerStatus.repeatMode}
            isShuffle={playerStatus.isShuffle}
            playbackRate={playerStatus.playbackRate || 1.0}
            sleepTimerMinutes={playerStatus.sleepTimerMinutes || 0}
            sleepTimerRemainingSec={playerStatus.sleepTimerRemainingSec || 0}
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
            onCyclePlaybackRate={() => audioPlayer.cyclePlaybackRate()}
            onSetSleepTimer={(mins) => audioPlayer.setSleepTimer(mins)}
            onSelectQueueSong={(track, idx) => handlePlaySong(track, idx)}
            onToggleFavorite={handleToggleFavorite}
            onOpenEditor={(song, tabKey) => handleOpenEditor(song, tabKey)}
          />

          {/* Modal Edit Judul, Artist, Genre, Cover, Lyrics & Detail */}
          <RenameModal
            visible={!!songToEdit}
            song={songToEdit}
            initialTab={editorInitialTab}
            theme={theme}
            onClose={() => setSongToEdit(null)}
            onSave={handleSaveMetadata}
          />

          {/* Modal Pengaturan (Tema Hitam/Putih & Sorting Lagu) */}
          <SettingsModal
            visible={isSettingsVisible}
            onClose={() => setIsSettingsVisible(false)}
            theme={theme}
            themeMode={themeMode}
            onSelectTheme={handleSelectTheme}
            sortOrder={sortOrder}
            onSelectSortOrder={handleSelectSortOrder}
            totalSongs={songs.length}
            totalBytes={totalStorageBytes}
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
    fontFamily: CENURA_FONT,
    fontSize: 23,
    fontWeight: '500',
    marginLeft: 9,
    letterSpacing: -0.7,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    paddingHorizontal: 13,
    height: 40,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontFamily: CENURA_FONT,
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
    paddingVertical: 6.5,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginRight: 8,
  },
  tabText: {
    fontFamily: CENURA_FONT,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
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
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 7,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 2,
    paddingBottom: 10,
  },
  quickPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  quickPlayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 2,
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
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  demoBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
