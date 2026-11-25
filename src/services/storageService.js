import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SONGS_DIR = `${FileSystem.documentDirectory}songs/`;
const SONGS_METADATA_KEY = '@soundvault_songs';
const PLAYLISTS_KEY = '@soundvault_playlists';
const FAVORITES_KEY = '@soundvault_favorites';

// Memastikan folder penyimpanan lokal ada
export const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(SONGS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
  }
};

// Ambil semua metadata lagu yang tersimpan
export const getStoredSongs = async () => {
  try {
    const json = await AsyncStorage.getItem(SONGS_METADATA_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Gagal mengambil metadata lagu:', error);
    return [];
  }
};

// Simpan metadata lagu
export const saveSongsMetadata = async (songs) => {
  try {
    await AsyncStorage.setItem(SONGS_METADATA_KEY, JSON.stringify(songs));
  } catch (error) {
    console.error('Gagal menyimpan metadata lagu:', error);
  }
};

// Import lagu dari File Picker iOS (aplikasi Files / iCloud)
export const importSongFromDevice = async () => {
  try {
    await ensureDirectoryExists();

    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Dibatalkan' };
    }

    const currentSongs = await getStoredSongs();
    const importedSongs = [];

    for (const asset of result.assets) {
      const originalName = asset.name || 'Unknown Song.mp3';
      const cleanTitle = originalName.replace(/\.[^/.]+$/, ''); // Hapus ekstensi
      const ext = originalName.split('.').pop() || 'mp3';
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const destinationUri = `${SONGS_DIR}${fileId}.${ext}`;

      // Salin file dari cache ke direktori permanen aplikasi
      await FileSystem.copyAsync({
        from: asset.uri,
        to: destinationUri,
      });

      const newSong = {
        id: fileId,
        title: cleanTitle,
        filename: originalName,
        uri: destinationUri,
        size: asset.size || 0,
        mimeType: asset.mimeType || 'audio/mpeg',
        createdAt: new Date().toISOString(),
        duration: 0, // Akan dihitung saat pertama kali diputar
      };

      importedSongs.push(newSong);
    }

    const updatedSongs = [...importedSongs, ...currentSongs];
    await saveSongsMetadata(updatedSongs);

    return { success: true, count: importedSongs.length, songs: updatedSongs };
  } catch (error) {
    console.error('Gagal mengimpor lagu:', error);
    return { success: false, error: error.message };
  }
};

// Hapus file lagu dari penyimpanan permanen & metadata
export const deleteSong = async (songId) => {
  try {
    const songs = await getStoredSongs();
    const targetSong = songs.find((s) => s.id === songId);

    if (targetSong && targetSong.uri) {
      const fileInfo = await FileSystem.getInfoAsync(targetSong.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetSong.uri, { idempotent: true });
      }
    }

    const updatedSongs = songs.filter((s) => s.id !== songId);
    await saveSongsMetadata(updatedSongs);

    // Hapus juga dari favorit jika ada
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter((id) => id !== songId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

    return updatedSongs;
  } catch (error) {
    console.error('Gagal menghapus lagu:', error);
    throw error;
  }
};

// Ubah judul lagu
export const renameSongTitle = async (songId, newTitle) => {
  try {
    const songs = await getStoredSongs();
    const updatedSongs = songs.map((s) => {
      if (s.id === songId) {
        return { ...s, title: newTitle.trim() };
      }
      return s;
    });
    await saveSongsMetadata(updatedSongs);
    return updatedSongs;
  } catch (error) {
    console.error('Gagal mengganti nama lagu:', error);
    throw error;
  }
};

// Ambil ID lagu favorit
export const getFavorites = async () => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    return [];
  }
};

// Toggle status favorit
export const toggleFavoriteSong = async (songId) => {
  try {
    const favorites = await getFavorites();
    let updated;
    if (favorites.includes(songId)) {
      updated = favorites.filter((id) => id !== songId);
    } else {
      updated = [...favorites, songId];
    }
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Gagal toggle favorit:', error);
    return [];
  }
};
