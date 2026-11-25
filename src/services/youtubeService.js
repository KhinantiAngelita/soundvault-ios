import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ensureDirectoryExists,
  addDownloadedSong,
  getStoredSongs,
} from './storageService';

const isWeb = Platform.OS === 'web';
const SONGS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}songs/`;
const COVERS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}covers/`;

// Daftar instance publik untuk ekstraksi audio YouTube (berurutan sebagai fallback)
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt-api.kwiatekmiki.com',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.private.coffee',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
];

export const extractYouTubeVideoId = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:m\.youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
};

export const fetchYouTubePreview = async (rawUrl) => {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error('Link YouTube tidak valid. Pastikan salin link dari YouTube / YouTube Music.');
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
    );
    if (resp.ok) {
      const data = await resp.json();
      const rawTitle = (data.title || 'YouTube Audio').trim();
      const rawAuthor = (data.author_name || 'YouTube').replace(/\s*-\s*Topic$/i, '').trim();

      // Pisahkan "Artist - Title" jika ada
      let title = rawTitle;
      let artist = rawAuthor;
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        if (parts.length >= 2) {
          artist = parts[0].trim() || rawAuthor;
          title = parts.slice(1).join(' - ').trim() || rawTitle;
        }
      }

      return {
        videoId,
        canonicalUrl,
        title,
        artist,
        thumbnailUrl: data.thumbnail_url || thumbnailUrl,
      };
    }
  } catch (e) {
    // Fallback ke thumbnail standar
  }

  return {
    videoId,
    canonicalUrl,
    title: `YouTube Track (${videoId})`,
    artist: 'YouTube',
    thumbnailUrl,
  };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
};

const resolveViaInnerTube = async (videoId, onStatus) => {
  if (isWeb) return null;
  const clients = [
    {
      clientName: 'ANDROID_VR',
      clientVersion: '1.60.19',
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      osName: 'Android',
      osVersion: '12L',
      userAgent: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    },
    {
      clientName: 'IOS',
      clientVersion: '19.45.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone14,3',
      osName: 'iPhone',
      osVersion: '18.1.0.22B83',
      userAgent: 'com.google.ios.youtube/19.45.4 (iPhone14,3; U; CPU iOS 18_1 like Mac OS X)',
    },
  ];

  for (const c of clients) {
    try {
      onStatus && onStatus('Mengambil audio langsung dari YouTube...');
      const resp = await fetchWithTimeout(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': c.userAgent,
          },
          body: JSON.stringify({
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
            context: {
              client: {
                clientName: c.clientName,
                clientVersion: c.clientVersion,
                deviceMake: c.deviceMake,
                deviceModel: c.deviceModel,
                osName: c.osName,
                osVersion: c.osVersion,
                hl: 'en',
                gl: 'US',
              },
            },
          }),
        },
        12000
      );

      if (resp.ok) {
        const json = await resp.json();
        const formats = json?.streamingData?.adaptiveFormats || [];
        // Pilih audio/mp4 (AAC/M4A) bitrate tertinggi (itag 140/141) — 100% native iOS AVPlayer
        const mp4Audio = formats
          .filter((f) => f.url && (f.mimeType || '').startsWith('audio/mp4'))
          .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));

        if (mp4Audio[0] && mp4Audio[0].url) {
          return {
            url: mp4Audio[0].url,
            ext: 'm4a',
            mimeType: 'audio/mp4',
          };
        }
      }
    } catch (e) {
      // Lanjut ke client berikutnya
    }
  }
  return null;
};

const resolveAudioStreamUrl = async (videoId, canonicalUrl, onStatus) => {
  // 1. Direct YouTube InnerTube API (langsung dari iPhone, paling cepat & tanpa limit server pihak ketiga)
  const direct = await resolveViaInnerTube(videoId, onStatus);
  if (direct) return direct;

  // 2. Fallback: Cobalt API (langsung MP3)
  for (const base of COBALT_INSTANCES) {
    try {
      onStatus && onStatus('Menghubungkan ke server konversi MP3...');
      const resp = await fetchWithTimeout(
        `${base}/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: canonicalUrl,
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '192',
          }),
        },
        10000
      );
      if (resp.ok) {
        const json = await resp.json();
        if ((json.status === 'tunnel' || json.status === 'redirect') && json.url) {
          return { url: json.url, ext: 'mp3', mimeType: 'audio/mpeg' };
        }
      }
    } catch (e) {
      // Lanjut ke instance berikutnya
    }
  }

  // 2. Fallback: Piped API (direct M4A / AAC audio stream native iOS)
  for (const base of PIPED_INSTANCES) {
    try {
      onStatus && onStatus('Mencari aliran audio kualitas terbaik...');
      const resp = await fetchWithTimeout(`${base}/streams/${videoId}`, {}, 10000);
      if (resp.ok) {
        const json = await resp.json();
        const streams = Array.isArray(json.audioStreams) ? json.audioStreams : [];
        // Prioritaskan m4a (MP4/AAC) karena didukung 100% native AVPlayer iOS
        const m4aStreams = streams
          .filter((s) => s.url && (s.mimeType || '').includes('mp4'))
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const chosen = m4aStreams[0] || streams.find((s) => s.url);
        if (chosen && chosen.url) {
          const isM4a = (chosen.mimeType || '').includes('mp4');
          return {
            url: chosen.url,
            ext: isM4a ? 'm4a' : 'mp3',
            mimeType: chosen.mimeType || 'audio/mp4',
          };
        }
      }
    } catch (e) {
      // Lanjut
    }
  }

  // 3. Fallback: Invidious API
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      onStatus && onStatus('Mencoba server cadangan...');
      const resp = await fetchWithTimeout(`${base}/api/v1/videos/${videoId}`, {}, 10000);
      if (resp.ok) {
        const json = await resp.json();
        const formats = Array.isArray(json.adaptiveFormats) ? json.adaptiveFormats : [];
        const audioFormats = formats
          .filter((f) => f.url && (f.type || '').startsWith('audio/mp4'))
          .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));
        if (audioFormats[0] && audioFormats[0].url) {
          return { url: audioFormats[0].url, ext: 'm4a', mimeType: 'audio/mp4' };
        }
      }
    } catch (e) {
      // Lanjut
    }
  }

  return null;
};

export const downloadYouTubeToSoundVault = async (rawUrl, previewMeta = null, onStatus = null) => {
  const meta = previewMeta || (await fetchYouTubePreview(rawUrl));

  // Cegah duplikat: periksa apakah link YouTube ini sudah pernah disimpan
  try {
    const existing = await getStoredSongs();
    const dup = existing.find(
      (s) => s.notes && s.notes.includes(`v=${meta.videoId}`)
    );
    if (dup) {
      throw new Error(`Lagu "${dup.title}" sudah tersimpan di pustaka SoundVault kamu.`);
    }
  } catch (e) {
    if (e.message && e.message.includes('sudah tersimpan')) {
      throw e;
    }
  }

  const stream = await resolveAudioStreamUrl(meta.videoId, meta.canonicalUrl, onStatus);

  if (!stream || !stream.url) {
    throw new Error(
      isWeb
        ? 'Browser web memblokir pengunduhan langsung YouTube (CORS). Fitur ini berjalan penuh di aplikasi iPhone (IPA).'
        : 'Server ekstraksi YouTube sedang sibuk/dibatasi. Coba lagi beberapa saat lagi atau pastikan koneksi internet stabil.'
    );
  }

  const fileId = `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let destinationUri = stream.url;
  let savedCoverUri = meta.thumbnailUrl || null;
  let fileSize = 0;

  if (!isWeb) {
    await ensureDirectoryExists();
    onStatus && onStatus('Mengunduh audio ke penyimpanan iPhone...');

    const safeBase = `${meta.artist} - ${meta.title}`
      .replace(/[\\/:*?"<>|]/g, '')
      .trim() || fileId;
    destinationUri = `${SONGS_DIR}${safeBase}.${stream.ext}`;
    try {
      const existsInfo = await FileSystem.getInfoAsync(destinationUri);
      if (existsInfo.exists) {
        destinationUri = `${SONGS_DIR}${safeBase}_${fileId.slice(-4)}.${stream.ext}`;
      }
    } catch (e) {
      destinationUri = `${SONGS_DIR}${fileId}.${stream.ext}`;
    }
    const dlResult = await FileSystem.downloadAsync(stream.url, destinationUri);

    if (!dlResult || (dlResult.status && dlResult.status >= 400)) {
      throw new Error('Gagal mengunduh file audio dari server.');
    }

    try {
      const info = await FileSystem.getInfoAsync(destinationUri);
      if (info.exists && info.size) {
        fileSize = info.size;
      }
    } catch (e) {
      // Abaikan
    }

    // Unduh juga cover thumbnail YouTube secara offline
    if (meta.thumbnailUrl) {
      try {
        const coverDest = `${COVERS_DIR}cover_${fileId}.jpg`;
        const coverDl = await FileSystem.downloadAsync(meta.thumbnailUrl, coverDest);
        if (coverDl && (!coverDl.status || coverDl.status < 400)) {
          savedCoverUri = coverDest;
        }
      } catch (e) {
        savedCoverUri = null;
      }
    }
  }

  const safeFilename = `${meta.artist} - ${meta.title}.${stream.ext}`.replace(
    /[\\/:*?"<>|]/g,
    ''
  );

  const newSong = {
    id: fileId,
    title: meta.title,
    artist: meta.artist,
    genre: 'YouTube',
    album: 'YouTube Downloads',
    year: new Date().getFullYear().toString(),
    lyrics: '',
    notes: `Sumber: ${meta.canonicalUrl}`,
    coverUri: savedCoverUri,
    filename: safeFilename,
    uri: destinationUri,
    size: fileSize,
    mimeType: stream.mimeType,
    createdAt: new Date().toISOString(),
    duration: 0,
    playCount: 0,
    lastPlayedAt: null,
  };

  const updatedSongs = await addDownloadedSong(newSong);
  return { song: newSong, songs: updatedSongs };
};
