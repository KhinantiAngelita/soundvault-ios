import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { GENRE_LIST, CENURA_FONT } from '../utils/theme';
import { formatFileSize } from '../utils/formatters';
import { pickCoverImageFromDevice } from '../services/storageService';
import AntigravityLogo from './AntigravityLogo';

export default function RenameModal({
  visible,
  song,
  initialTab = 'info', // 'info' | 'cover' | 'lyrics' | 'details'
  theme,
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');
  const [coverUri, setCoverUri] = useState(null);
  const [isPickingCover, setIsPickingCover] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || 'Unknown Artist');
      setAlbum(song.album || 'Single');
      setYear(song.year || '2026');
      setGenre(song.genre || 'Pop');
      setLyrics(song.lyrics || '');
      setNotes(song.notes || '');
      setCoverUri(song.coverUri || null);
    }
  }, [song]);

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  if (!song) return null;

  const handlePickCover = async () => {
    setIsPickingCover(true);
    try {
      const res = await pickCoverImageFromDevice();
      if (res.success && res.coverUri) {
        setCoverUri(res.coverUri);
      }
    } finally {
      setIsPickingCover(false);
    }
  };

  const handleSave = () => {
    onSave(song.id, {
      title: title.trim() || song.title,
      artist: artist.trim() || 'Unknown Artist',
      album: album.trim() || 'Single',
      year: year.trim() || '2026',
      genre: genre.trim() || 'Pop',
      lyrics,
      notes: notes.trim(),
      coverUri,
    });
    onClose();
  };

  const formatReadableDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return iso;
    }
  };

  const lyricsLineCount = lyrics.trim() ? lyrics.trim().split('\n').length : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header Native iOS Sheet: Batal | Judul | Simpan */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.headerActionText, { color: theme.textSecondary }]}>
                Batal
              </Text>
            </TouchableOpacity>

            <Text
              style={[styles.headerTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              Info Lagu
            </Text>

            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.headerSaveText, { color: theme.accent }]}>
                Simpan
              </Text>
            </TouchableOpacity>
          </View>

          {/* iOS Segmented Control Bersih (Tanpa Ikon Ramai) */}
          <View
            style={[
              styles.segmentedBar,
              { backgroundColor: theme.surfaceElevated },
            ]}
          >
            {[
              { key: 'info', label: 'Info' },
              { key: 'cover', label: 'Cover' },
              { key: 'lyrics', label: 'Lirik' },
              { key: 'details', label: 'File' },
            ].map((t) => {
              const active = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.segmentItem,
                    active && [
                      styles.segmentItemActive,
                      { backgroundColor: theme.surface },
                    ],
                  ]}
                  onPress={() => setActiveTab(t.key)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active ? theme.text : theme.textSecondary,
                        fontWeight: active ? '600' : '500',
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Isi Konten */}
          <ScrollView
            style={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'info' && (
              <View>
                {/* iOS Grouped Form Table */}
                <View
                  style={[
                    styles.groupedTable,
                    { backgroundColor: theme.surfaceElevated },
                  ]}
                >
                  {[
                    {
                      label: 'Judul',
                      val: title,
                      setter: setTitle,
                      placeholder: 'Judul lagu',
                    },
                    {
                      label: 'Artist',
                      val: artist,
                      setter: setArtist,
                      placeholder: 'Nama artist',
                    },
                    {
                      label: 'Album',
                      val: album,
                      setter: setAlbum,
                      placeholder: 'Single / Album',
                    },
                    {
                      label: 'Tahun',
                      val: year,
                      setter: setYear,
                      placeholder: '2026',
                      numeric: true,
                    },
                    {
                      label: 'Catatan',
                      val: notes,
                      setter: setNotes,
                      placeholder: 'Opsional',
                    },
                  ].map((field, idx, arr) => (
                    <View
                      key={field.label}
                      style={[
                        styles.formRow,
                        idx < arr.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.formRowLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {field.label}
                      </Text>
                      <TextInput
                        style={[styles.formRowInput, { color: theme.text }]}
                        value={field.val}
                        onChangeText={field.setter}
                        placeholder={field.placeholder}
                        placeholderTextColor={theme.textMuted}
                        keyboardType={field.numeric ? 'numeric' : 'default'}
                      />
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionCaption, { color: theme.textSecondary }]}>
                  GENRE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.genreScroll}
                >
                  {GENRE_LIST.map((g) => {
                    const selected = genre.toLowerCase() === g.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genreChip,
                          {
                            backgroundColor: selected
                              ? theme.accent
                              : theme.surfaceElevated,
                          },
                        ]}
                        onPress={() => setGenre(g)}
                      >
                        <Text
                          style={[
                            styles.genreChipText,
                            { color: selected ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {activeTab === 'cover' && (
              <View style={styles.coverTabContainer}>
                <View
                  style={[
                    styles.coverPreviewBox,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {coverUri ? (
                    <Image
                      source={{ uri: coverUri }}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.defaultCoverPlaceholder}>
                      <AntigravityLogo size={54} theme={theme} />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.groupedTable,
                    {
                      backgroundColor: theme.surfaceElevated,
                      width: '100%',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.actionCell,
                      coverUri && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={handlePickCover}
                    disabled={isPickingCover}
                  >
                    {isPickingCover ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Text style={[styles.actionCellText, { color: theme.accent }]}>
                        {coverUri ? 'Ganti Foto Cover...' : 'Pilih Foto dari Perangkat...'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {coverUri && (
                    <TouchableOpacity
                      style={styles.actionCell}
                      onPress={() => setCoverUri(null)}
                    >
                      <Text style={[styles.actionCellText, { color: theme.danger }]}>
                        Hapus Cover
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {activeTab === 'lyrics' && (
              <View>
                <View style={styles.lyricsHeaderRow}>
                  <Text style={[styles.sectionCaption, { color: theme.textSecondary, marginBottom: 0 }]}>
                    TEKS LIRIK {lyricsLineCount > 0 ? `(${lyricsLineCount} BARIS)` : ''}
                  </Text>
                  {lyrics.length > 0 && (
                    <TouchableOpacity onPress={() => setLyrics('')}>
                      <Text style={[styles.clearLyricsText, { color: theme.danger }]}>
                        Kosongkan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.lyricsInput,
                    {
                      backgroundColor: theme.surfaceElevated,
                      color: theme.text,
                    },
                  ]}
                  value={lyrics}
                  onChangeText={setLyrics}
                  placeholder="Tulis atau tempel lirik lagu di sini..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {activeTab === 'details' && (
              <View
                style={[
                  styles.groupedTable,
                  { backgroundColor: theme.surfaceElevated },
                ]}
              >
                {[
                  { label: 'Nama File', value: song.filename || '-' },
                  { label: 'Ukuran', value: formatFileSize(song.size) },
                  { label: 'Format', value: song.mimeType || 'audio/mpeg' },
                  { label: 'Ditambahkan', value: formatReadableDate(song.createdAt) },
                  {
                    label: 'Lirik',
                    value:
                      lyricsLineCount > 0
                        ? `${lyricsLineCount} baris`
                        : 'Tidak ada',
                  },
                  {
                    label: 'Cover Art',
                    value: coverUri ? 'Kustom' : 'Default',
                  },
                ].map((row, idx, arr) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      idx < arr.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {row.label}
                    </Text>
                    <Text
                      style={[styles.detailValue, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    maxHeight: '86%',
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 16.5,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerActionText: {
    fontFamily: CENURA_FONT,
    fontSize: 15,
    fontWeight: '400',
  },
  headerSaveText: {
    fontFamily: CENURA_FONT,
    fontSize: 15,
    fontWeight: '600',
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2.5,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6.5,
    borderRadius: 7,
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12.5,
  },
  bodyScroll: {
    maxHeight: 370,
  },
  groupedTable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  formRowLabel: {
    width: 72,
    fontSize: 14,
    fontWeight: '400',
  },
  formRowInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionCaption: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
  },
  genreScroll: {
    marginBottom: 6,
  },
  genreChip: {
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 14,
    marginRight: 7,
  },
  genreChipText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  coverTabContainer: {
    alignItems: 'center',
    paddingTop: 6,
  },
  coverPreviewBox: {
    width: 154,
    height: 154,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  defaultCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCell: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCellText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  lyricsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearLyricsText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  lyricsInput: {
    height: 210,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    lineHeight: 21,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1.5,
    textAlign: 'right',
    opacity: 0.85,
  },
});
