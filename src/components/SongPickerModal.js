import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';
import { hapticSelection, hapticSuccess } from '../utils/haptics';

/**
 * Modal checklist untuk memilih banyak lagu sekaligus
 * (dipakai untuk memasukkan lagu ke Playlist maupun ke Favorit).
 */
export default function SongPickerModal({
  visible,
  title = 'Pilih Lagu',
  subtitle = '',
  songs = [],
  initialSelectedIds = [],
  theme,
  onClose,
  onConfirm,
}) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedIds(initialSelectedIds || []);
      setQuery('');
    }
  }, [visible, initialSelectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q)
    );
  }, [songs, query]);

  if (!visible) return null;

  const toggleId = (id) => {
    hapticSelection();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const handleToggleAll = () => {
    hapticSelection();
    if (allSelected) {
      const filteredSet = new Set(filtered.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...filtered.map((s) => s.id)]))
      );
    }
  };

  const handleSave = () => {
    hapticSuccess();
    onConfirm && onConfirm(selectedIds);
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                Batal
              </Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 8 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && (
                <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.saveText, { color: theme.accent }]}>
                Simpan ({selectedIds.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search & Pilih Semua */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Cari lagu..."
                placeholderTextColor={theme.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.selectAllBtn,
                { backgroundColor: theme.surfaceElevated },
              ]}
              onPress={handleToggleAll}
            >
              <Text style={[styles.selectAllText, { color: theme.accent }]}>
                {allSelected ? 'Kosongkan' : 'Semua'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daftar Lagu */}
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Belum ada lagu di pustaka.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.songRow,
                      index < filtered.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={() => toggleId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={checked ? theme.accentStrong : theme.textMuted}
                      style={{ marginRight: 11 }}
                    />
                    <View
                      style={[
                        styles.thumb,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                    >
                      {item.coverUri ? (
                        <Image source={{ uri: item.coverUri }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons name="musical-note" size={16} color={theme.textMuted} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.songTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[styles.songArtist, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.artist || 'Unknown Artist'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cancelText: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontFamily: CENURA_FONT,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: CENURA_FONT,
    fontSize: 11.5,
    marginTop: 1,
  },
  saveText: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
  },
  selectAllBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllText: {
    fontFamily: CENURA_FONT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  list: {
    maxHeight: 360,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  songTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  songArtist: {
    fontFamily: CENURA_FONT,
    fontSize: 12,
    marginTop: 1,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: CENURA_FONT,
    fontSize: 13.5,
  },
});
