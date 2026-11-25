import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';
const SONGS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}songs/`;
const SONGS_METADATA_KEY = '@soundvault_songs';
const FAVORITES_KEY = '@soundvault_favorites';
const THEME_KEY = '@soundvault_theme_mode';

export const ensureDirectoryExists = async () => {
  if (isWeb) return;
  const dirInfo = await FileSystem.getInfoAsync(SONGS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
  }
};

export const getSavedThemeMode = async () => {
  try {
    const mode = await AsyncStorage.getItem(THEME_KEY);
    return mode === 'light' ? 'light' : 'dark';
  } catch (e) {
    return 'dark';
  }
};

export const saveThemeMode = async (mode) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch (e) {
    console.error('Gagal menyimpan tema:', e);
  }
};

// Otomatis memisahkan "Artist - Judul Lagu" dari nama file jika ada tanda " - "
const parseFilenameMetadata = (rawName) => {
  const withoutExt = rawName.replace(/\.[^/.]+$/, '').trim();
  if (withoutExt.includes(' - ')) {
    const parts = withoutExt.split(' - ');
    const artist = parts[0].trim() || 'Unknown Artist';
    const title = parts.slice(1).join(' - ').trim() || withoutExt;
    return { title, artist };
  }
  return { title: withoutExt, artist: 'Unknown Artist' };
};

export const getStoredSongs = async () => {
  try {
    const json = await AsyncStorage.getItem(SONGS_METADATA_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    // Pastikan lagu lama tetap memiliki field artist & genre default
    return parsed.map((song) => ({
      ...song,
      artist: song.artist || 'Unknown Artist',
      genre: song.genre || 'Pop',
    }));
  } catch (error) {
    console.error('Gagal mengambil metadata lagu:', error);
    return [];
  }
};

export const saveSongsMetadata = async (songs) => {
  try {
    await AsyncStorage.setItem(SONGS_METADATA_KEY, JSON.stringify(songs));
  } catch (error) {
    console.error('Gagal menyimpan metadata lagu:', error);
  }
};

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
      const { title, artist } = parseFilenameMetadata(originalName);
      const ext = originalName.split('.').pop() || 'mp3';
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      let destinationUri = asset.uri;

      if (!isWeb) {
        destinationUri = `${SONGS_DIR}${fileId}.${ext}`;
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destinationUri,
        });
      }

      const newSong = {
        id: fileId,
        title,
        artist,
        genre: 'Pop',
        filename: originalName,
        uri: destinationUri,
        size: asset.size || (asset.file ? asset.file.size : 0) || 0,
        mimeType: asset.mimeType || 'audio/mpeg',
        createdAt: new Date().toISOString(),
        duration: 0,
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

export const deleteSong = async (songId) => {
  try {
    const songs = await getStoredSongs();
    const targetSong = songs.find((s) => s.id === songId);

    if (!isWeb && targetSong && targetSong.uri) {
      const fileInfo = await FileSystem.getInfoAsync(targetSong.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetSong.uri, { idempotent: true });
      }
    }

    const updatedSongs = songs.filter((s) => s.id !== songId);
    await saveSongsMetadata(updatedSongs);

    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter((id) => id !== songId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

    return updatedSongs;
  } catch (error) {
    console.error('Gagal menghapus lagu:', error);
    throw error;
  }
};

// Update metadata lagu (Judul, Artist, Genre)
export const updateSongMetadata = async (songId, updates) => {
  try {
    const songs = await getStoredSongs();
    const updatedSongs = songs.map((s) => {
      if (s.id === songId) {
        return {
          ...s,
          title: updates.title?.trim() || s.title,
          artist: updates.artist?.trim() || 'Unknown Artist',
          genre: updates.genre?.trim() || 'Lainnya',
        };
      }
      return s;
    });
    await saveSongsMetadata(updatedSongs);
    return updatedSongs;
  } catch (error) {
    console.error('Gagal memperbarui metadata lagu:', error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    return [];
  }
};

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
