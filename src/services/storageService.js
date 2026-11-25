import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base64ToBytes, parseID3TagsFromBytes } from '../utils/id3Parser';

const isWeb = Platform.OS === 'web';
const SONGS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}songs/`;
const COVERS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}covers/`;
const SONGS_METADATA_KEY = '@soundvault_songs';
const FAVORITES_KEY = '@soundvault_favorites';
const PLAYLISTS_KEY = '@soundvault_playlists';
const LAST_SONG_KEY = '@soundvault_last_song_id';
const LAST_POS_KEY = '@soundvault_last_song_pos';
const THEME_KEY = '@soundvault_theme_mode';
const SORT_KEY = '@soundvault_sort_order';

export const ensureDirectoryExists = async () => {
  if (isWeb) return;
  const songsDirInfo = await FileSystem.getInfoAsync(SONGS_DIR);
  if (!songsDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
  }
  const coversDirInfo = await FileSystem.getInfoAsync(COVERS_DIR);
  if (!coversDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
  }
};

export const getSavedThemeMode = async () => {
  try {
    const mode = await AsyncStorage.getItem(THEME_KEY);
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      return mode;
    }
    return 'system';
  } catch (e) {
    return 'system';
  }
};

export const saveThemeMode = async (mode) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch (e) {
    console.error('Gagal menyimpan tema:', e);
  }
};

export const getSavedSortOrder = async () => {
  try {
    const sort = await AsyncStorage.getItem(SORT_KEY);
    return sort || 'newest';
  } catch (e) {
    return 'newest';
  }
};

export const saveSortOrder = async (sortOrder) => {
  try {
    await AsyncStorage.setItem(SORT_KEY, sortOrder);
  } catch (e) {
    console.error('Gagal menyimpan urutan sortir:', e);
  }
};

export const getLastPlayedSongId = async () => {
  try {
    return await AsyncStorage.getItem(LAST_SONG_KEY);
  } catch (e) {
    return null;
  }
};

export const saveLastPlayedSongId = async (songId) => {
  try {
    if (!songId) return;
    await AsyncStorage.setItem(LAST_SONG_KEY, songId);
  } catch (e) {
    // Abaikan
  }
};

export const getLastPlayedPosition = async () => {
  try {
    const val = await AsyncStorage.getItem(LAST_POS_KEY);
    return val ? Math.max(0, Number(val) || 0) : 0;
  } catch (e) {
    return 0;
  }
};

export const saveLastPlayedPosition = async (positionMs) => {
  try {
    await AsyncStorage.setItem(LAST_POS_KEY, String(Math.floor(positionMs || 0)));
  } catch (e) {
    // Abaikan
  }
};

// Manajemen Custom Playlist
export const getPlaylists = async () => {
  try {
    const json = await AsyncStorage.getItem(PLAYLISTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const savePlaylists = async (playlists) => {
  try {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error('Gagal menyimpan playlist:', e);
  }
};

export const createPlaylist = async (name) => {
  const cleanName = (name || '').trim();
  if (!cleanName) return await getPlaylists();
  const current = await getPlaylists();
  const newPlaylist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    songIds: [],
    createdAt: new Date().toISOString(),
  };
  const updated = [...current, newPlaylist];
  await savePlaylists(updated);
  return updated;
};

export const deletePlaylist = async (playlistId) => {
  const current = await getPlaylists();
  const updated = current.filter((p) => p.id !== playlistId);
  await savePlaylists(updated);
  return updated;
};

export const toggleSongInPlaylist = async (playlistId, songId) => {
  const current = await getPlaylists();
  const updated = current.map((p) => {
    if (p.id !== playlistId) return p;
    const exists = (p.songIds || []).includes(songId);
    const nextIds = exists
      ? p.songIds.filter((id) => id !== songId)
      : [...(p.songIds || []), songId];
    return { ...p, songIds: nextIds };
  });
  await savePlaylists(updated);
  return updated;
};

export const addSongsToPlaylist = async (playlistId, songIds = []) => {
  const current = await getPlaylists();
  const updated = current.map((p) => {
    if (p.id !== playlistId) return p;
    const merged = Array.from(new Set([...(p.songIds || []), ...songIds]));
    return { ...p, songIds: merged };
  });
  await savePlaylists(updated);
  return updated;
};

export const setPlaylistSongs = async (playlistId, songIds = []) => {
  const current = await getPlaylists();
  const updated = current.map((p) => {
    if (p.id !== playlistId) return p;
    return { ...p, songIds: Array.from(new Set(songIds)) };
  });
  await savePlaylists(updated);
  return updated;
};

export const updatePlaylistInfo = async (playlistId, updates = {}) => {
  const current = await getPlaylists();
  const updated = current.map((p) => {
    if (p.id !== playlistId) return p;
    return {
      ...p,
      name: updates.name !== undefined ? updates.name.trim() || p.name : p.name,
      coverUri: updates.coverUri !== undefined ? updates.coverUri : p.coverUri || null,
    };
  });
  await savePlaylists(updated);
  return updated;
};

export const addDownloadedSong = async (newSong) => {
  const currentSongs = await getStoredSongs();
  const updatedSongs = [newSong, ...currentSongs];
  await saveSongsMetadata(updatedSongs);
  return updatedSongs;
};

export const addSongsToFavorites = async (songIds = []) => {
  try {
    const favorites = await getFavorites();
    const merged = Array.from(new Set([...favorites, ...songIds]));
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return await getFavorites();
  }
};

export const setFavoriteSongs = async (songIds = []) => {
  try {
    const clean = Array.from(new Set(songIds));
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(clean));
    return clean;
  } catch (e) {
    return await getFavorites();
  }
};

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
    return parsed.map((song) => ({
      ...song,
      artist: song.artist || 'Unknown Artist',
      genre: song.genre || 'Pop',
      album: song.album || 'Single',
      year: song.year || '2026',
      lyrics: song.lyrics || '',
      notes: song.notes || '',
      coverUri: song.coverUri || null,
      playCount: Number(song.playCount) || 0,
      lastPlayedAt: song.lastPlayedAt || null,
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

const fileToDataUrlWeb = (file) =>
  new Promise((resolve) => {
    if (!file || typeof FileReader === 'undefined') {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

export const pickCoverImageFromDevice = async () => {
  try {
    await ensureDirectoryExists();

    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, canceled: true };
    }

    const asset = result.assets[0];
    let coverUri = asset.uri;

    if (isWeb) {
      if (asset.file) {
        const dataUrl = await fileToDataUrlWeb(asset.file);
        if (dataUrl) coverUri = dataUrl;
      }
    } else {
      const ext = (asset.name || 'cover.jpg').split('.').pop() || 'jpg';
      const coverId = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const destUri = `${COVERS_DIR}${coverId}.${ext}`;
      await FileSystem.copyAsync({
        from: asset.uri,
        to: destUri,
      });
      coverUri = destUri;
    }

    return { success: true, coverUri };
  } catch (error) {
    console.error('Gagal memilih gambar cover:', error);
    return { success: false, error: error.message };
  }
};

const deleteCoverFileIfExists = async (coverUri) => {
  if (isWeb || !coverUri || coverUri.startsWith('data:')) return;
  try {
    const info = await FileSystem.getInfoAsync(coverUri);
    if (info.exists) {
      await FileSystem.deleteAsync(coverUri, { idempotent: true });
    }
  } catch (e) {
    // Abaikan
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
        const safeBase = originalName
          .replace(/\.[^/.]+$/, '')
          .replace(/[\\/:*?"<>|]/g, '')
          .trim() || fileId;
        let candidate = `${SONGS_DIR}${safeBase}.${ext}`;
        try {
          const existsInfo = await FileSystem.getInfoAsync(candidate);
          if (existsInfo.exists) {
            candidate = `${SONGS_DIR}${safeBase}_${fileId.slice(-4)}.${ext}`;
          }
        } catch (e) {
          candidate = `${SONGS_DIR}${fileId}.${ext}`;
        }
        destinationUri = candidate;
        await FileSystem.copyAsync({
          from: asset.uri,
          to: destinationUri,
        });
      }

      // Baca metadata ID3v2 (Judul, Artist, Album, Tahun, Genre, Lirik, Cover) otomatis untuk MP3
      let id3 = {};
      let extractedCoverUri = null;
      try {
        let headerBytes = null;
        if (isWeb && asset.file && typeof asset.file.slice === 'function') {
          const sliceBuf = await asset.file.slice(0, 524288).arrayBuffer();
          headerBytes = new Uint8Array(sliceBuf);
        } else if (!isWeb && ext.toLowerCase() === 'mp3') {
          const base64Header = await FileSystem.readAsStringAsync(destinationUri, {
            encoding: FileSystem.EncodingType.Base64,
            position: 0,
            length: 524288,
          });
          if (base64Header) {
            headerBytes = base64ToBytes(base64Header);
          }
        }

        if (headerBytes) {
          id3 = parseID3TagsFromBytes(headerBytes);
          if (id3.cover && id3.cover.base64) {
            if (isWeb) {
              extractedCoverUri = `data:${id3.cover.mime};base64,${id3.cover.base64}`;
            } else {
              const coverDest = `${COVERS_DIR}cover_${fileId}.${id3.cover.ext}`;
              await FileSystem.writeAsStringAsync(coverDest, id3.cover.base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              extractedCoverUri = coverDest;
            }
          }
        }
      } catch (id3Err) {
        // Jika file bukan MP3 atau tidak punya ID3 tag, lanjutkan dengan nama file biasa
      }

      const newSong = {
        id: fileId,
        title: id3.title || title,
        artist: id3.artist || artist,
        genre: id3.genre || 'Pop',
        album: id3.album || 'Single',
        year: id3.year || new Date().getFullYear().toString(),
        lyrics: id3.lyrics || '',
        notes: '',
        coverUri: extractedCoverUri,
        filename: originalName,
        uri: destinationUri,
        size: asset.size || (asset.file ? asset.file.size : 0) || 0,
        mimeType: asset.mimeType || 'audio/mpeg',
        createdAt: new Date().toISOString(),
        duration: 0,
        playCount: 0,
        lastPlayedAt: null,
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

    if (!isWeb && targetSong) {
      if (targetSong.uri && targetSong.uri.startsWith('file://')) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetSong.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(targetSong.uri, { idempotent: true });
          }
        } catch (e) {
          // Abaikan jika file sudah tidak ada
        }
      }
      if (targetSong.coverUri) {
        await deleteCoverFileIfExists(targetSong.coverUri);
      }
    }

    const updatedSongs = songs.filter((s) => s.id !== songId);
    await saveSongsMetadata(updatedSongs);

    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter((id) => id !== songId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

    const playlists = await getPlaylists();
    const updatedPlaylists = playlists.map((pl) => ({
      ...pl,
      songIds: (pl.songIds || []).filter((id) => id !== songId),
    }));
    await savePlaylists(updatedPlaylists);

    return updatedSongs;
  } catch (error) {
    console.error('Gagal menghapus lagu:', error);
    throw error;
  }
};

export const updateSongMetadata = async (songId, updates) => {
  try {
    const songs = await getStoredSongs();
    const updatedSongs = [];

    for (const s of songs) {
      if (s.id === songId) {
        if (
          Object.prototype.hasOwnProperty.call(updates, 'coverUri') &&
          s.coverUri &&
          s.coverUri !== updates.coverUri
        ) {
          await deleteCoverFileIfExists(s.coverUri);
        }

        updatedSongs.push({
          ...s,
          title: updates.title !== undefined ? updates.title.trim() || s.title : s.title,
          artist:
            updates.artist !== undefined
              ? updates.artist.trim() || 'Unknown Artist'
              : s.artist,
          genre: updates.genre !== undefined ? updates.genre.trim() || 'Lainnya' : s.genre,
          album: updates.album !== undefined ? updates.album.trim() || 'Single' : s.album,
          year: updates.year !== undefined ? updates.year.trim() || '2026' : s.year,
          lyrics: updates.lyrics !== undefined ? updates.lyrics : s.lyrics || '',
          notes: updates.notes !== undefined ? updates.notes : s.notes || '',
          coverUri:
            updates.coverUri !== undefined ? updates.coverUri : s.coverUri || null,
          duration:
            updates.duration !== undefined ? updates.duration : s.duration || 0,
        });
      } else {
        updatedSongs.push(s);
      }
    }

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

export const incrementSongPlayCount = async (songId) => {
  if (!songId) return null;
  try {
    const songs = await getStoredSongs();
    let changed = false;
    const updated = songs.map((s) => {
      if (s.id === songId) {
        changed = true;
        return {
          ...s,
          playCount: (Number(s.playCount) || 0) + 1,
          lastPlayedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    if (changed) {
      await saveSongsMetadata(updated);
      return updated;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const AUDIO_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'mp4']);

// Pindai folder Documents/songs (On My iPhone -> SoundVault -> songs) untuk file audio baru
export const syncSongsFromLocalFolder = async () => {
  if (isWeb) {
    return { count: 0, songs: await getStoredSongs() };
  }
  await ensureDirectoryExists();
  const currentSongs = await getStoredSongs();
  const existingUris = new Set(currentSongs.map((s) => s.uri));
  const files = await FileSystem.readDirectoryAsync(SONGS_DIR);

  const newlyFound = [];
  for (const filename of files) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) continue;

    const fullUri = `${SONGS_DIR}${filename}`;
    if (existingUris.has(fullUri)) continue;

    const fileId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { title, artist } = parseFilenameMetadata(filename);
    let size = 0;
    try {
      const info = await FileSystem.getInfoAsync(fullUri);
      if (info.exists && info.size) size = info.size;
    } catch (e) {
      // Abaikan
    }

    let id3 = {};
    let extractedCoverUri = null;
    if (ext === 'mp3') {
      try {
        const base64Header = await FileSystem.readAsStringAsync(fullUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: 0,
          length: 524288,
        });
        if (base64Header) {
          id3 = parseID3TagsFromBytes(base64ToBytes(base64Header));
          if (id3.cover && id3.cover.base64) {
            const coverDest = `${COVERS_DIR}cover_${fileId}.${id3.cover.ext}`;
            await FileSystem.writeAsStringAsync(coverDest, id3.cover.base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            extractedCoverUri = coverDest;
          }
        }
      } catch (e) {
        // Abaikan jika gagal parse ID3
      }
    }

    newlyFound.push({
      id: fileId,
      title: id3.title || title,
      artist: id3.artist || artist,
      genre: id3.genre || 'Pop',
      album: id3.album || 'Single',
      year: id3.year || new Date().getFullYear().toString(),
      lyrics: id3.lyrics || '',
      notes: '',
      coverUri: extractedCoverUri,
      filename,
      uri: fullUri,
      size,
      mimeType: ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
      createdAt: new Date().toISOString(),
      duration: 0,
      playCount: 0,
      lastPlayedAt: null,
    });
  }

  if (newlyFound.length > 0) {
    const updated = [...newlyFound, ...currentSongs];
    await saveSongsMetadata(updated);
    return { count: newlyFound.length, songs: updated };
  }
  return { count: 0, songs: currentSongs };
};
