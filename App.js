import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Modal,
  AppState,
  useColorScheme,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
  addSongsToFavorites,
  setFavoriteSongs,
  getSavedThemeMode,
  saveThemeMode,
  getSavedSortOrder,
  saveSortOrder,
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  toggleSongInPlaylist,
  addSongsToPlaylist,
  setPlaylistSongs,
  updatePlaylistInfo,
  getLastPlayedSongId,
  saveLastPlayedSongId,
  getLastPlayedPosition,
  incrementSongPlayCount,
  syncSongsFromLocalFolder,
} from './src/services/storageService';
import * as Font from 'expo-font';
import { audioPlayer } from './src/services/audioService';
import { extractYouTubeVideoId } from './src/services/youtubeService';
import { THEMES, CENURA_FONT } from './src/utils/theme';
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from './src/utils/haptics';
import AntigravityLogo from './src/components/AntigravityLogo';
import SongItem from './src/components/SongItem';
import MiniPlayer from './src/components/MiniPlayer';
import PlayerModal from './src/components/PlayerModal';
import RenameModal from './src/components/RenameModal';
import SettingsModal from './src/components/SettingsModal';
import SplashScreen from './src/components/SplashScreen';
import BottomNavbar from './src/components/BottomNavbar';
import PlaylistView from './src/components/PlaylistView';
import YouTubeDownloadView from './src/components/YouTubeDownloadView';
import SongPickerModal from './src/components/SongPickerModal';
import AppDialog from './src/components/AppDialog';

export default function App() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'system' | 'dark' | 'light'
  const resolvedThemeMode =
    themeMode === 'system'
      ? systemColorScheme === 'light'
        ? 'light'
        : 'dark'
      : themeMode;
  const theme = THEMES[resolvedThemeMode] || THEMES.dark;

  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeNav, setActiveNav] = useState('library'); // 'library' | 'playlists' | 'favorites' | 'download'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'artists' | 'genres'
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Multi-Select State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [isBatchPlaylistModalVisible, setIsBatchPlaylistModalVisible] = useState(false);
  const [batchNewPlaylistName, setBatchNewPlaylistName] = useState('');
  const [isFavoritePickerVisible, setIsFavoritePickerVisible] = useState(false);
  const [playlistCreateSignal, setPlaylistCreateSignal] = useState(0);
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);

  // Auto-Deteksi Link YouTube dari Clipboard
  const [detectedYtUrl, setDetectedYtUrl] = useState('');
  const [pendingYtUrl, setPendingYtUrl] = useState('');
  const dismissedYtUrlRef = useRef('');

  // Custom Design-System Dialog (menggantikan Alert.alert bawaan)
  const [dialogConfig, setDialogConfig] = useState(null);
  const showDialog = (cfg) => {
    setDialogConfig({
      title: cfg.title || '',
      message: cfg.message || '',
      type: cfg.type || 'info',
      confirmText: cfg.confirmText || 'OK',
      cancelText: cfg.cancelText || null,
      onConfirm: cfg.onConfirm || null,
    });
  };
  const closeDialog = () => setDialogConfig(null);

  // Subtle iOS Toast Pill
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    if (!msg) return;
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 1800);
  };

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
    abLoopA: null,
    abLoopB: null,
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
    // Load font geometris bergaya Cenura sebelum animasi Splash Screen dimulai
    Font.loadAsync({
      CenuraGeometric: require('./assets/fonts/CenuraGeometric.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));

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

    const unsubSongChange = audioPlayer.subscribeSongChange(async (song) => {
      if (song?.id) {
        saveLastPlayedSongId(song.id);
        const updated = await incrementSongPlayCount(song.id);
        if (updated) {
          setSongs(updated);
        }
      }
    });

    const checkClipboardForYouTube = async () => {
      if (Platform.OS === 'web') return;
      try {
        const text = await Clipboard.getStringAsync();
        const clean = (text || '').trim();
        if (clean && extractYouTubeVideoId(clean) && clean !== dismissedYtUrlRef.current) {
          setDetectedYtUrl(clean);
        }
      } catch (e) {
        // Abaikan jika izin clipboard belum diberikan
      }
    };

    checkClipboardForYouTube();
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkClipboardForYouTube();
      }
    });

    return () => {
      unsubStatus();
      unsubSongChange();
      appStateSub.remove();
    };
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [stored, favs, savedMode, savedSort, storedPlaylists, lastSongId, lastPos] =
        await Promise.all([
          getStoredSongs(),
          getFavorites(),
          getSavedThemeMode(),
          getSavedSortOrder(),
          getPlaylists(),
          getLastPlayedSongId(),
          getLastPlayedPosition(),
        ]);
      setSongs(stored);
      setFavorites(favs);
      setThemeMode(savedMode);
      setSortOrder(savedSort);
      setPlaylists(storedPlaylists);

      // Otomatis tampilkan lagu terakhir & detik terakhir di MiniPlayer saat aplikasi dibuka
      if (lastSongId && stored.length > 0) {
        const lastSong = stored.find((s) => s.id === lastSongId);
        if (lastSong) {
          audioPlayer.preloadSong(lastSong, stored, lastPos);
        }
      }
    } catch (e) {
      console.error('Error load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTheme = async (mode) => {
    hapticSelection();
    setThemeMode(mode);
    await saveThemeMode(mode);
  };

  const handleSelectSortOrder = async (newSort) => {
    hapticSelection();
    setSortOrder(newSort);
    await saveSortOrder(newSort);
  };

  const handleSyncLocalFolder = async () => {
    hapticSelection();
    setIsSettingsVisible(false);
    try {
      const res = await syncSongsFromLocalFolder();
      setSongs(res.songs);
      if (res.count > 0) {
        hapticSuccess();
        setTimeout(() => {
          showDialog({
            title: 'Sinkronisasi Berhasil',
            message: `${res.count} lagu baru dari folder On My iPhone berhasil ditambahkan.`,
            type: 'success',
          });
        }, 280);
      } else {
        setTimeout(() => {
          showDialog({
            title: 'Sudah Terbaru',
            message: 'Tidak ada file lagu baru yang ditemukan di folder SoundVault.',
            type: 'info',
          });
        }, 280);
      }
    } catch (e) {
      setTimeout(() => {
        showDialog({
          title: 'Gagal Sinkronisasi',
          message: e.message || 'Terjadi kesalahan saat memindai folder.',
          type: 'danger',
        });
      }, 280);
    }
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await syncSongsFromLocalFolder();
      setSongs(res.songs);
      if (res.count > 0) {
        hapticSuccess();
      }
    } catch (e) {
      // Abaikan error ringan saat pull refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImportSongs = async () => {
    setIsImporting(true);
    try {
      const result = await importSongFromDevice();
      if (result.success) {
        hapticSuccess();
        setSongs(result.songs);
        showToast(`${result.count} lagu berhasil ditambahkan`);
      } else if (result.error) {
        showDialog({
          title: 'Gagal Mengimpor',
          message: result.error,
          type: 'danger',
        });
      }
    } catch (err) {
      showDialog({
        title: 'Terjadi Kesalahan',
        message: err.message || 'Gagal mengimpor lagu.',
        type: 'danger',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePlaySong = async (song, index, customQueue = null) => {
    hapticLight();
    const listToPlay = customQueue || displayedSongs;
    await audioPlayer.playSong(song, listToPlay, index);
  };

  const handlePlayNext = async (song) => {
    hapticSuccess();
    await audioPlayer.playNext(song);
    showToast(`"${song.title}" diputar berikutnya`);
  };

  const handleToggleFavorite = async (songId) => {
    hapticLight();
    const wasFav = favorites.includes(songId);
    const updated = await toggleFavoriteSong(songId);
    setFavorites(updated);
    showToast(wasFav ? 'Dihapus dari Favorit' : 'Ditambahkan ke Favorit');
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

  const handleCreatePlaylistWithSongs = async (name, songIds = [], coverUri = null) => {
    let updated = await createPlaylist(name);
    if (updated.length > 0) {
      const newest = updated[updated.length - 1];
      if (songIds.length > 0) {
        updated = await setPlaylistSongs(newest.id, songIds);
      }
      if (coverUri) {
        updated = await updatePlaylistInfo(newest.id, { coverUri });
      }
    }
    setPlaylists(updated);
  };

  const handleSetPlaylistSongs = async (playlistId, songIds) => {
    const updated = await setPlaylistSongs(playlistId, songIds);
    setPlaylists(updated);
  };

  const handleUpdatePlaylistInfo = async (playlistId, updates) => {
    const updated = await updatePlaylistInfo(playlistId, updates);
    setPlaylists(updated);
  };

  const handleSetFavoriteSongs = async (songIds) => {
    const updated = await setFavoriteSongs(songIds);
    setFavorites(updated);
  };

  // Multi-Select Handlers
  const handleEnterSelectionMode = (initialSongId = null) => {
    hapticMedium();
    setIsSelectionMode(true);
    setSelectedSongIds(initialSongId ? [initialSongId] : []);
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedSongIds([]);
  };

  const handleToggleSelectSong = (songId) => {
    hapticSelection();
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleBatchAddToFavorites = async () => {
    if (selectedSongIds.length === 0) return;
    hapticSuccess();
    const count = selectedSongIds.length;
    const updated = await addSongsToFavorites(selectedSongIds);
    setFavorites(updated);
    handleExitSelectionMode();
    showToast(`${count} lagu ditambahkan ke Favorit`);
  };

  const handleBatchAddToPlaylist = async (playlistId) => {
    if (selectedSongIds.length === 0) return;
    hapticSuccess();
    const count = selectedSongIds.length;
    const updated = await addSongsToPlaylist(playlistId, selectedSongIds);
    setPlaylists(updated);
    setIsBatchPlaylistModalVisible(false);
    handleExitSelectionMode();
    showToast(`${count} lagu ditambahkan ke Playlist`);
  };

  const handleBatchCreateAndAddToPlaylist = async () => {
    const clean = batchNewPlaylistName.trim();
    if (!clean || selectedSongIds.length === 0) return;
    hapticSuccess();
    await handleCreatePlaylistWithSongs(clean, selectedSongIds, null);
    setBatchNewPlaylistName('');
    setIsBatchPlaylistModalVisible(false);
    handleExitSelectionMode();
  };

  const handleBatchDeleteSongs = async () => {
    if (selectedSongIds.length === 0) return;
    const count = selectedSongIds.length;
    showDialog({
      title: `Hapus ${count} Lagu?`,
      message: 'Lagu yang dipilih akan dihapus permanen dari penyimpanan SoundVault.',
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: async () => {
        for (const id of selectedSongIds) {
          await handleDeleteSong(id);
        }
        handleExitSelectionMode();
        showToast(`${count} lagu dihapus`);
      },
    });
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
      showDialog({
        title: 'Gagal Menghapus',
        message: 'Tidak dapat menghapus lagu dari penyimpanan.',
        type: 'danger',
      });
    }
  };

  const handleSaveMetadata = async (songId, updates) => {
    try {
      const updated = await updateSongMetadata(songId, updates);
      setSongs(updated);
      audioPlayer.updateSongInMemory(songId, updates);
      showToast('Perubahan lagu disimpan');
    } catch (err) {
      showDialog({
        title: 'Gagal Menyimpan',
        message: 'Tidak dapat menyimpan perubahan info lagu.',
        type: 'danger',
      });
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

      if (activeNav === 'favorites') {
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

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortOrder === 'za') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sortOrder === 'most_played') {
        const diff = (Number(b.playCount) || 0) - (Number(a.playCount) || 0);
        if (diff !== 0) return diff;
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
    activeNav,
    activeTab,
    favorites,
    selectedArtist,
    selectedGenre,
    sortOrder,
  ]);

  const handleSelectTab = (tabKey) => {
    hapticSelection();
    setActiveTab(tabKey);
    if (tabKey !== 'artists') setSelectedArtist(null);
    if (tabKey !== 'genres') setSelectedGenre(null);
    if (tabKey !== 'playlists') setSelectedPlaylistId(null);
  };

  // Tunggu font Cenura selesai dimuat agar tidak ada perubahan/kedipan font di Splash Screen
  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle={resolvedThemeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />
        <View style={{ flex: 1, backgroundColor: theme.bg }} />
      </SafeAreaProvider>
    );
  }

  // Halaman Splash Screen Tersendiri (Terpisah Penuh dari Landing Page)
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle={resolvedThemeMode === 'dark' ? 'light-content' : 'dark-content'}
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
          barStyle={resolvedThemeMode === 'dark' ? 'light-content' : 'dark-content'}
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
                onPress={() => {
                  hapticSelection();
                  setIsAddMenuVisible(true);
                }}
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

          {/* Banner Auto-Deteksi Link YouTube dari Clipboard */}
          {!!detectedYtUrl && activeNav !== 'download' && (
            <View
              style={[
                styles.clipBanner,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accentBorder,
                },
              ]}
            >
              <Ionicons name="logo-youtube" size={18} color={theme.accent} />
              <Text
                style={[styles.clipBannerText, { color: theme.text }]}
                numberOfLines={1}
              >
                Link YouTube terdeteksi di clipboard
              </Text>
              <TouchableOpacity
                style={[styles.clipSaveBtn, { backgroundColor: theme.accentStrong }]}
                onPress={() => {
                  hapticSelection();
                  dismissedYtUrlRef.current = detectedYtUrl;
                  setPendingYtUrl(detectedYtUrl);
                  setDetectedYtUrl('');
                  setActiveNav('download');
                }}
              >
                <Text style={styles.clipSaveBtnText}>Simpan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  dismissedYtUrlRef.current = detectedYtUrl;
                  setDetectedYtUrl('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* === TAB PLAYLIST (KARTU PLAYLIST ALA REFERENSI + BUAT LANGSUNG) === */}
          {activeNav === 'playlists' && (
            <PlaylistView
              playlists={playlists}
              songs={songs}
              favorites={favorites}
              theme={theme}
              playerStatus={playerStatus}
              createTriggerSignal={playlistCreateSignal}
              onShowDialog={showDialog}
              onCreatePlaylistWithSongs={handleCreatePlaylistWithSongs}
              onSetPlaylistSongs={handleSetPlaylistSongs}
              onUpdatePlaylistInfo={handleUpdatePlaylistInfo}
              onDeletePlaylist={handleDeletePlaylist}
              onPlaySong={handlePlaySong}
              onPlayAll={(list, shuffle) => audioPlayer.playAll(list, shuffle)}
              onPlayNext={handlePlayNext}
              onToggleFavorite={handleToggleFavorite}
              onToggleSongInPlaylist={handleToggleSongInPlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onEditSong={(song, tabKey) => handleOpenEditor(song, tabKey)}
              onDeleteSong={handleDeleteSong}
            />
          )}

          {/* === TAB UNDUH YOUTUBE KE MP3 === */}
          {activeNav === 'download' && (
            <YouTubeDownloadView
              theme={theme}
              songs={songs}
              playerStatus={playerStatus}
              initialUrl={pendingYtUrl}
              onConsumeInitialUrl={() => setPendingYtUrl('')}
              onShowDialog={showDialog}
              onSongDownloaded={(updatedSongs) => setSongs(updatedSongs)}
              onPlaySong={handlePlaySong}
            />
          )}

          {/* === TAB PUSTAKA & TAB FAVORIT === */}
          {(activeNav === 'library' || activeNav === 'favorites') && (
            <View style={{ flex: 1 }}>
              {/* Header Khusus Tab Favorit (Bersih tanpa tombol biru dobel; aksi tambah lewat + di header) */}
              {activeNav === 'favorites' && (
                <View style={styles.favTabHeader}>
                  <View>
                    <Text style={[styles.favTabTitle, { color: theme.text }]}>
                      Favorit
                    </Text>
                    <Text style={[styles.favTabCount, { color: theme.textMuted }]}>
                      {displayedSongs.length} lagu disukai
                    </Text>
                  </View>
                </View>
              )}

              {/* Search Bar & Filter Chips Khusus Tab Pustaka */}
              {activeNav === 'library' && (
                <>
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

                  {/* Navigasi Filter Ringkas (Semua, Artist, Genre) */}
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
                </>
              )}

          {/* Sub-Filter Pill ketika di Tab Artist */}
          {activeNav === 'library' && activeTab === 'artists' && artistGroups.length > 0 && (
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
          {activeNav === 'library' && activeTab === 'genres' && genreGroups.length > 0 && (
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

          {/* Baris Mode Pilih Banyak (Multi-Select Header) */}
          {isSelectionMode && (
            <View
              style={[
                styles.selectionBar,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.selectionCountText, { color: theme.text }]}>
                {selectedSongIds.length} lagu dipilih
              </Text>
              <View style={styles.selectionBarRight}>
                <TouchableOpacity
                  onPress={() => {
                    hapticSelection();
                    const allSelected =
                      displayedSongs.length > 0 &&
                      displayedSongs.every((s) => selectedSongIds.includes(s.id));
                    if (allSelected) {
                      setSelectedSongIds([]);
                    } else {
                      setSelectedSongIds(displayedSongs.map((s) => s.id));
                    }
                  }}
                >
                  <Text style={[styles.selectionActionLink, { color: theme.accent }]}>
                    {displayedSongs.length > 0 &&
                    displayedSongs.every((s) => selectedSongIds.includes(s.id))
                      ? 'Kosongkan'
                      : 'Pilih Semua'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleExitSelectionMode}>
                  <Text style={[styles.selectionActionLink, { color: theme.textSecondary }]}>
                    Batal
                  </Text>
                </TouchableOpacity>
              </View>
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
                  name={activeNav === 'favorites' ? 'heart-outline' : 'disc-outline'}
                  size={40}
                  color={theme.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeNav === 'favorites'
                  ? 'Belum Ada Lagu Favorit'
                  : searchQuery
                  ? 'Tidak Ditemukan'
                  : 'Pustaka Masih Kosong'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {activeNav === 'favorites'
                  ? 'Ketuk tombol "+" di kanan atas lalu pilih "Tambah Favorit", atau geser kiri pada lagu.'
                  : searchQuery
                  ? `Tidak ada lagu yang cocok dengan "${searchQuery}".`
                  : 'Ketuk tombol "+" di kanan atas untuk impor lagu, atau buka tab Simpan untuk YouTube.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayedSongs}
              keyExtractor={(item) => item.id}
              refreshing={isRefreshing}
              onRefresh={activeNav === 'library' ? handlePullToRefresh : undefined}
              initialNumToRender={12}
              maxToRenderPerBatch={10}
              windowSize={7}
              contentContainerStyle={[
                styles.listContent,
                playerStatus.currentSong || isSelectionMode
                  ? { paddingBottom: 130 }
                  : { paddingBottom: 24 },
              ]}
              ListHeaderComponent={
                !isSelectionMode && displayedSongs.length > 0 ? (
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedSongIds.includes(item.id)}
                  playlists={playlists}
                  onPress={() => handlePlaySong(item, index)}
                  onLongPress={handleEnterSelectionMode}
                  onToggleSelect={handleToggleSelectSong}
                  onPlayNext={handlePlayNext}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleSongInPlaylist={handleToggleSongInPlaylist}
                  onCreatePlaylist={handleCreatePlaylist}
                  onEdit={(song, tabKey) => handleOpenEditor(song, tabKey)}
                  onDelete={handleDeleteSong}
                />
              )}
            />
          )}

          {/* Floating Batch Action Bar saat Mode Multi-Select Aktif */}
          {isSelectionMode && (
            <View
              style={[
                styles.batchActionBar,
                {
                  backgroundColor: theme.mode === 'light' ? '#FFFFFF' : '#151B26',
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.batchBtn,
                  {
                    backgroundColor:
                      selectedSongIds.length > 0
                        ? theme.accentSoft
                        : theme.surfaceElevated,
                  },
                ]}
                disabled={selectedSongIds.length === 0}
                onPress={() => setIsBatchPlaylistModalVisible(true)}
              >
                <Ionicons
                  name="albums-outline"
                  size={16}
                  color={selectedSongIds.length > 0 ? theme.accent : theme.textMuted}
                />
                <Text
                  style={[
                    styles.batchBtnText,
                    { color: selectedSongIds.length > 0 ? theme.accent : theme.textMuted },
                  ]}
                >
                  + Playlist
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.batchBtn,
                  {
                    backgroundColor:
                      selectedSongIds.length > 0
                        ? theme.accentSoft
                        : theme.surfaceElevated,
                  },
                ]}
                disabled={selectedSongIds.length === 0}
                onPress={handleBatchAddToFavorites}
              >
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={selectedSongIds.length > 0 ? theme.accent : theme.textMuted}
                />
                <Text
                  style={[
                    styles.batchBtnText,
                    { color: selectedSongIds.length > 0 ? theme.accent : theme.textMuted },
                  ]}
                >
                  Favorit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.batchDeleteBtn,
                  { backgroundColor: theme.surfaceElevated },
                ]}
                disabled={selectedSongIds.length === 0}
                onPress={handleBatchDeleteSongs}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={selectedSongIds.length > 0 ? theme.danger : theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
            </View>
          )}

          {/* Mini Player Melayang di Atas Bottom Navbar */}
          {playerStatus.currentSong && !isSelectionMode && (
            <MiniPlayer
              currentSong={playerStatus.currentSong}
              theme={theme}
              isPlaying={playerStatus.isPlaying}
              onPress={() => setIsPlayerModalVisible(true)}
              onTogglePlayPause={() => audioPlayer.togglePlayPause()}
              onNext={() => audioPlayer.nextSong()}
              onPrevious={() => audioPlayer.previousSong()}
            />
          )}

          {/* Subtle Floating Toast Pill */}
          {!!toastMessage && (
            <View pointerEvents="none" style={styles.toastWrap}>
              <View
                style={[
                  styles.toastPill,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#0F172A' : '#F8FAFC',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.toastText,
                    { color: theme.mode === 'light' ? '#FFFFFF' : '#0F172A' },
                  ]}
                  numberOfLines={1}
                >
                  {toastMessage}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Navigation Bar */}
          <BottomNavbar
            activeNav={activeNav}
            onSelectNav={(navKey) => {
              if (isSelectionMode) handleExitSelectionMode();
              setActiveNav(navKey);
            }}
            theme={theme}
          />

          {/* Modal Pilih / Buat Playlist untuk Lagu Hasil Multi-Select */}
          {isBatchPlaylistModalVisible && (
            <Modal
              visible={isBatchPlaylistModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setIsBatchPlaylistModalVisible(false)}
            >
              <TouchableOpacity
                style={[styles.batchModalOverlay, { backgroundColor: theme.overlay }]}
                activeOpacity={1}
                onPress={() => setIsBatchPlaylistModalVisible(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={[
                    styles.batchModalCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.batchModalTitle, { color: theme.text }]}>
                    Masukkan {selectedSongIds.length} Lagu ke Playlist
                  </Text>

                  <View style={styles.batchNewPlRow}>
                    <TextInput
                      style={[
                        styles.batchNewPlInput,
                        {
                          backgroundColor: theme.surfaceElevated,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Buat playlist baru..."
                      placeholderTextColor={theme.textMuted}
                      value={batchNewPlaylistName}
                      onChangeText={setBatchNewPlaylistName}
                      onSubmitEditing={handleBatchCreateAndAddToPlaylist}
                    />
                    <TouchableOpacity
                      style={[
                        styles.batchNewPlBtn,
                        { backgroundColor: theme.accentStrong },
                      ]}
                      onPress={handleBatchCreateAndAddToPlaylist}
                    >
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {playlists.length > 0 && (
                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                      {playlists.map((pl, idx) => (
                        <TouchableOpacity
                          key={pl.id}
                          style={[
                            styles.batchPlRow,
                            idx < playlists.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: theme.border,
                            },
                          ]}
                          onPress={() => handleBatchAddToPlaylist(pl.id)}
                        >
                          <Ionicons name="albums-outline" size={18} color={theme.accent} />
                          <Text
                            style={[styles.batchPlName, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {pl.name}
                          </Text>
                          <Text style={[styles.batchPlCount, { color: theme.textMuted }]}>
                            {(pl.songIds || []).length} lagu
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Dropdown Menu Tombol "+" di Header (Impor Lagu | Buat Playlist | Tambah Favorit) */}
          {isAddMenuVisible && (
            <Modal
              visible={isAddMenuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setIsAddMenuVisible(false)}
            >
              <TouchableOpacity
                style={styles.addMenuBackdrop}
                activeOpacity={1}
                onPress={() => setIsAddMenuVisible(false)}
              >
                <View
                  style={[
                    styles.addDropdownCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      shadowColor: theme.mode === 'light' ? '#0F172A' : '#000000',
                    },
                  ]}
                >
                  {[
                    {
                      label: 'Impor Lagu',
                      icon: 'musical-note-outline',
                      onPress: () => {
                        setIsAddMenuVisible(false);
                        setTimeout(() => handleImportSongs(), 260);
                      },
                    },
                    {
                      label: 'Buat Playlist',
                      icon: 'albums-outline',
                      onPress: () => {
                        setIsAddMenuVisible(false);
                        setActiveNav('playlists');
                        setTimeout(() => setPlaylistCreateSignal((n) => n + 1), 260);
                      },
                    },
                    {
                      label: 'Tambah Favorit',
                      icon: 'heart-outline',
                      onPress: () => {
                        setIsAddMenuVisible(false);
                        setTimeout(() => setIsFavoritePickerVisible(true), 260);
                      },
                    },
                  ].map((item, idx, arr) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.addDropdownRow,
                        idx < arr.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={theme.accent}
                        style={{ marginRight: 11 }}
                      />
                      <Text style={[styles.addDropdownText, { color: theme.text }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Modal Multi-Select Lagu untuk Tab Favorit */}
          {isFavoritePickerVisible && (
            <SongPickerModal
              visible={isFavoritePickerVisible}
              title="Pilih Lagu Favorit"
              subtitle="Centang lagu yang ingin masuk Favorit"
              songs={songs}
              initialSelectedIds={favorites}
              theme={theme}
              onClose={() => setIsFavoritePickerVisible(false)}
              onConfirm={handleSetFavoriteSongs}
            />
          )}

          {/* Modal Player Layar Penuh (Hanya Mount Saat Dibuka agar Tidak Menghalangi Sentuhan di iOS) */}
          {isPlayerModalVisible && playerStatus.currentSong && (
            <PlayerModal
              visible={isPlayerModalVisible}
              onClose={() => setIsPlayerModalVisible(false)}
              currentSong={playerStatus.currentSong}
              queue={audioPlayer.queue.length > 0 ? audioPlayer.queue : displayedSongs}
              theme={theme}
              isPlaying={playerStatus.isPlaying}
              duration={playerStatus.duration}
              position={playerStatus.position}
              repeatMode={playerStatus.repeatMode}
              isShuffle={playerStatus.isShuffle}
              playbackRate={playerStatus.playbackRate || 1.0}
              sleepTimerMinutes={playerStatus.sleepTimerMinutes || 0}
              sleepTimerRemainingSec={playerStatus.sleepTimerRemainingSec || 0}
              abLoopA={playerStatus.abLoopA ?? null}
              abLoopB={playerStatus.abLoopB ?? null}
              isFavorite={favorites.includes(playerStatus.currentSong.id)}
              onTogglePlayPause={() => audioPlayer.togglePlayPause()}
              onNext={() => audioPlayer.nextSong()}
              onPrevious={() => audioPlayer.previousSong()}
              onSeek={(val) => audioPlayer.seekTo(val)}
              onToggleRepeat={() => audioPlayer.toggleRepeatMode()}
              onToggleShuffle={() => audioPlayer.toggleShuffle()}
              onCyclePlaybackRate={() => audioPlayer.cyclePlaybackRate()}
              onSetSleepTimer={(mins) => audioPlayer.setSleepTimer(mins)}
              onToggleABLoop={() => audioPlayer.toggleABLoop()}
              onSelectQueueSong={(track, idx) =>
                handlePlaySong(
                  track,
                  idx,
                  audioPlayer.queue.length > 0 ? audioPlayer.queue : displayedSongs
                )
              }
              onRemoveFromQueue={(songId) => audioPlayer.removeSongFromQueue(songId)}
              onToggleFavorite={handleToggleFavorite}
              onOpenEditor={(song, tabKey) => handleOpenEditor(song, tabKey)}
            />
          )}

          {/* Modal Edit Judul, Artist, Genre, Cover, Lyrics & Detail */}
          {!!songToEdit && (
            <RenameModal
              visible={!!songToEdit}
              song={songToEdit}
              initialTab={editorInitialTab}
              theme={theme}
              onClose={() => setSongToEdit(null)}
              onSave={handleSaveMetadata}
            />
          )}

          {/* Custom Design-System Dialog Pop-up */}
          {!!dialogConfig && (
            <AppDialog
              visible={!!dialogConfig}
              title={dialogConfig.title}
              message={dialogConfig.message}
              type={dialogConfig.type}
              confirmText={dialogConfig.confirmText}
              cancelText={dialogConfig.cancelText}
              theme={theme}
              onCancel={closeDialog}
              onConfirm={() => {
                const cb = dialogConfig.onConfirm;
                closeDialog();
                if (cb) cb();
              }}
            />
          )}

          {/* Modal Pengaturan (Tema Sistem/Hitam/Putih & Sorting Lagu) */}
          {isSettingsVisible && (
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
              onSyncFolder={handleSyncLocalFolder}
            />
          )}
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
  favTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 14,
    paddingTop: 4,
  },
  favTabTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  favTabCount: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 1,
  },
  favPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 5,
  },
  favPickBtnText: {
    fontFamily: CENURA_FONT,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  quickSelectBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  selectionCountText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '600',
  },
  selectionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selectionActionLink: {
    fontFamily: CENURA_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  batchActionBar: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  batchBtn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  batchBtnText: {
    fontFamily: CENURA_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  batchDeleteBtn: {
    width: 42,
    height: 40,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  batchModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  batchModalTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  batchNewPlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  batchNewPlInput: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    paddingHorizontal: 12,
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  batchNewPlBtn: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchPlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
  },
  batchPlName: {
    flex: 1,
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    fontWeight: '500',
  },
  batchPlCount: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
  },
  clipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  clipBannerText: {
    flex: 1,
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    fontWeight: '500',
  },
  clipSaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  clipSaveBtnText: {
    fontFamily: CENURA_FONT,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addMenuBackdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 104 : 62,
    paddingRight: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  addDropdownCard: {
    width: 210,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  addDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  addDropdownText: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
    fontWeight: '500',
  },
  toastWrap: {
    position: 'absolute',
    top: 66,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 50,
  },
  toastPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    fontWeight: '600',
  },
});
