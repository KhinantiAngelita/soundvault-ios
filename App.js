import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getStoredSongs,
  importSongFromDevice,
  deleteSong,
  renameSongTitle,
  getFavorites,
  toggleFavoriteSong,
} from './src/services/storageService';
import { audioPlayer } from './src/services/audioService';
import SongItem from './src/components/SongItem';
import MiniPlayer from './src/components/MiniPlayer';
import PlayerModal from './src/components/PlayerModal';
import RenameModal from './src/components/RenameModal';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites'
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
  const [songToRename, setSongToRename] = useState(null);

  useEffect(() => {
    loadInitialData();

    // Berlangganan perubahan status audio
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
      const stored = await getStoredSongs();
      const favs = await getFavorites();
      setSongs(stored);
      setFavorites(favs);
    } catch (e) {
      console.error('Error load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSongs = async () => {
    setIsImporting(true);
    try {
      const result = await importSongFromDevice();
      if (result.success) {
        setSongs(result.songs);
        Alert.alert('Sukses!', `${result.count} lagu berhasil disimpan ke memori iPhone.`);
      } else if (result.error) {
        Alert.alert('Gagal Mengimpor', result.error);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handlePlaySong = async (song, index) => {
    const listToPlay = displayedSongs;
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

  const handleSaveRename = async (songId, newTitle) => {
    try {
      const updated = await renameSongTitle(songId, newTitle);
      setSongs(updated);
      if (playerStatus.currentSong?.id === songId) {
        setPlayerStatus((prev) => ({
          ...prev,
          currentSong: { ...prev.currentSong, title: newTitle },
        }));
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal mengganti nama lagu.');
    }
  };

  // Filter lagu berdasarkan tab dan pencarian
  const displayedSongs = songs.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') {
      return matchesSearch && favorites.includes(s.id);
    }
    return matchesSearch;
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0E" />

        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <Ionicons name="musical-notes" size={24} color="#8B5CF6" />
              <Text style={styles.appTitle}>SoundVault</Text>
            </View>
            <Text style={styles.appSubtitle}>Pemutar Musik Offline • 0 Iklan</Text>
          </View>

          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImportSongs}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.importBtnText}>Tambah</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari lagu di penyimpanan..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filter (Semua Lagu vs Favorit) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Semua Lagu ({songs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'favorites' && styles.tabBtnActive]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              Favorit ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Konten Daftar Lagu */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Memuat koleksi musik...</Text>
          </View>
        ) : displayedSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons
                name={activeTab === 'favorites' ? 'heart-dislike' : 'cloud-upload'}
                size={48}
                color="#6B7280"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'favorites'
                ? 'Belum Ada Lagu Favorit'
                : searchQuery
                ? 'Lagu Tidak Ditemukan'
                : 'Penyimpanan Masih Kosong'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'favorites'
                ? 'Tandai lagu dengan ikon hati untuk memindahkannya ke sini.'
                : searchQuery
                ? `Tidak ada lagu yang cocok dengan "${searchQuery}".`
                : 'Tekan tombol "+ Tambah" di atas untuk memilih lagu dari aplikasi Files iPhone Anda.'}
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
            renderItem={({ item, index }) => (
              <SongItem
                song={item}
                isPlaying={playerStatus.isPlaying}
                isCurrentSong={playerStatus.currentSong?.id === item.id}
                isFavorite={favorites.includes(item.id)}
                onPress={() => handlePlaySong(item, index)}
                onToggleFavorite={handleToggleFavorite}
                onRename={(song) => setSongToRename(song)}
                onDelete={handleDeleteSong}
              />
            )}
          />
        )}

        {/* Mini Player Melayang di Bawah */}
        <MiniPlayer
          currentSong={playerStatus.currentSong}
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
          isPlaying={playerStatus.isPlaying}
          duration={playerStatus.duration}
          position={playerStatus.position}
          repeatMode={playerStatus.repeatMode}
          isShuffle={playerStatus.isShuffle}
          isFavorite={
            playerStatus.currentSong ? favorites.includes(playerStatus.currentSong.id) : false
          }
          onTogglePlayPause={() => audioPlayer.togglePlayPause()}
          onNext={() => audioPlayer.nextSong()}
          onPrevious={() => audioPlayer.previousSong()}
          onSeek={(val) => audioPlayer.seekTo(val)}
          onToggleRepeat={() => audioPlayer.toggleRepeatMode()}
          onToggleShuffle={() => audioPlayer.toggleShuffle()}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Modal Ganti Nama Lagu */}
        <RenameModal
          visible={!!songToRename}
          song={songToRename}
          onClose={() => setSongToRename(null)}
          onSave={handleSaveRename}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
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
    backgroundColor: '#181822',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262636',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#181822',
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#181822',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
