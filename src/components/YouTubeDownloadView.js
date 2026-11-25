import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';
import {
  extractYouTubeVideoId,
  fetchYouTubePreview,
  downloadYouTubeToSoundVault,
} from '../services/youtubeService';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';

/**
 * Tab Khusus "Unduh":
 * Tempel link YouTube / YouTube Music -> preview judul & cover otomatis ->
 * unduh langsung sebagai audio offline ke dalam SoundVault.
 */
export default function YouTubeDownloadView({
  theme,
  songs = [],
  playerStatus,
  initialUrl = '',
  onConsumeInitialUrl,
  onShowDialog,
  onSongDownloaded,
  onPlaySong,
}) {
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      setUrlInput(initialUrl.trim());
      handleCheckUrl(initialUrl.trim());
      onConsumeInitialUrl && onConsumeInitialUrl();
    }
  }, [initialUrl]);

  const downloadedSongs = songs.filter((s) => (s.id || '').startsWith('yt_'));

  const handleCheckUrl = async (raw) => {
    const val = (raw !== undefined ? raw : urlInput).trim();
    setErrorMsg('');
    if (!val) {
      setPreview(null);
      return;
    }
    if (!extractYouTubeVideoId(val)) {
      setPreview(null);
      setErrorMsg('Tempel link video dari YouTube atau YouTube Music.');
      return;
    }
    setIsChecking(true);
    try {
      const meta = await fetchYouTubePreview(val);
      setPreview(meta);
    } catch (e) {
      setErrorMsg(e.message || 'Gagal membaca info video YouTube.');
      setPreview(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePasteClipboard = async () => {
    hapticSelection();
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setUrlInput(text.trim());
        await handleCheckUrl(text.trim());
      } else {
        setErrorMsg('Clipboard masih kosong. Salin link dari YouTube terlebih dahulu.');
      }
    } catch (e) {
      setErrorMsg('Tidak dapat membaca clipboard. Tempel link secara manual di kolom.');
    }
  };

  const handleDownload = async () => {
    if (!urlInput.trim()) return;
    hapticLight();
    setIsDownloading(true);
    setErrorMsg('');
    setStatusText('Menyiapkan unduhan...');

    try {
      const result = await downloadYouTubeToSoundVault(
        urlInput.trim(),
        preview,
        (msg) => setStatusText(msg)
      );
      hapticSuccess();
      onSongDownloaded && onSongDownloaded(result.songs);
      setUrlInput('');
      setPreview(null);
      setStatusText('');
      onShowDialog &&
        onShowDialog({
          title: 'Lagu Tersimpan',
          message: `"${result.song.title}" sudah tersimpan offline di SoundVault.`,
          type: 'success',
        });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengunduh audio YouTube.');
      setStatusText('');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        playerStatus.currentSong ? { paddingBottom: 120 } : { paddingBottom: 28 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Simpan dari YouTube</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Salin link lagu dari YouTube atau YouTube Music, lalu simpan langsung ke pustaka offline kamu.
        </Text>
      </View>

      {/* Kotak Input Link + Tombol Tempel */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="link-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="https://youtu.be/... atau youtube.com/watch?v=..."
            placeholderTextColor={theme.textMuted}
            value={urlInput}
            onChangeText={(txt) => {
              setUrlInput(txt);
              setErrorMsg('');
              if (extractYouTubeVideoId(txt)) {
                handleCheckUrl(txt);
              } else {
                setPreview(null);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => handleCheckUrl()}
          />
          {urlInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setUrlInput('');
                setPreview(null);
                setErrorMsg('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[
              styles.pasteBtn,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
            onPress={handlePasteClipboard}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.accent} />
            <Text style={[styles.pasteBtnText, { color: theme.accent }]}>
              Tempel Link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.downloadBtn,
              {
                backgroundColor:
                  urlInput.trim() && !isDownloading ? theme.accentStrong : theme.surfaceElevated,
              },
            ]}
            onPress={handleDownload}
            disabled={!urlInput.trim() || isDownloading}
            activeOpacity={0.85}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="cloud-download-outline"
                size={17}
                color={urlInput.trim() ? '#FFFFFF' : theme.textMuted}
              />
            )}
            <Text
              style={[
                styles.downloadBtnText,
                { color: urlInput.trim() || isDownloading ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              {isDownloading ? 'Menyimpan...' : 'Simpan Lagu'}
            </Text>
          </TouchableOpacity>
        </View>

        {isChecking && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              Membaca info video...
            </Text>
          </View>
        )}

        {!!statusText && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.statusText, { color: theme.accent }]}>{statusText}</Text>
          </View>
        )}

        {!!errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
          </View>
        )}

        {/* Preview Video YouTube */}
        {preview && (
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Image
              source={{ uri: preview.thumbnailUrl }}
              style={styles.previewThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={2}>
                {preview.title}
              </Text>
              <Text style={[styles.previewArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                {preview.artist}
              </Text>
              <Text style={[styles.previewBadge, { color: theme.accent }]}>
                Siap disimpan ke SoundVault
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Riwayat Unduhan YouTube */}
      {downloadedSongs.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            TERAKHIR DISIMPAN ({downloadedSongs.length})
          </Text>
          <View
            style={[
              styles.recentList,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {downloadedSongs.slice(0, 8).map((track, idx) => (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.recentRow,
                  idx < Math.min(downloadedSongs.length, 8) - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                ]}
                onPress={() => onPlaySong(track, idx, downloadedSongs)}
              >
                <View style={[styles.recentThumb, { backgroundColor: theme.surfaceElevated }]}>
                  {track.coverUri ? (
                    <Image source={{ uri: track.coverUri }} style={styles.fullImg} />
                  ) : (
                    <Ionicons name="musical-note" size={16} color={theme.accent} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentTitle, { color: theme.text }]} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={[styles.recentArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                <Ionicons name="play-circle-outline" size={24} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: CENURA_FONT,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: CENURA_FONT,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  card: {
    borderRadius: 18,
    padding: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pasteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pasteBtnText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '600',
  },
  downloadBtn: {
    flex: 1.25,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  downloadBtnText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: CENURA_FONT,
    fontSize: 12,
    lineHeight: 17,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewThumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
  },
  previewTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
  previewArtist: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 2,
  },
  previewBadge: {
    fontFamily: CENURA_FONT,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  recentSection: {
    marginTop: 22,
  },
  sectionLabel: {
    fontFamily: CENURA_FONT,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  recentList: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  recentThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 11,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  recentTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  recentArtist: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 1,
  },
});
