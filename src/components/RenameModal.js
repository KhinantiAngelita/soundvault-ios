import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { GENRE_LIST } from '../utils/theme';

export default function RenameModal({ visible, song, theme, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Pop');

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || 'Unknown Artist');
      setGenre(song.genre || 'Pop');
    }
  }, [song]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(song.id, {
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        genre: genre.trim() || 'Lainnya',
      });
      onClose();
    }
  };

  if (!song) return null;

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit Info Lagu
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Atur judul, nama artist, dan kategori genre lagu.
          </Text>

          {/* Input Judul */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>JUDUL LAGU</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceElevated,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Judul lagu..."
            placeholderTextColor={theme.textMuted}
          />

          {/* Input Artist */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>ARTIST</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceElevated,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={artist}
            onChangeText={setArtist}
            placeholder="Nama penyanyi / band..."
            placeholderTextColor={theme.textMuted}
          />

          {/* Pilihan Genre */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>GENRE</Text>
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
                      backgroundColor: selected ? theme.accentStrong : theme.surfaceElevated,
                      borderColor: selected ? theme.accentStrong : theme.border,
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

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                Batal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.accentStrong }]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Simpan</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14.5,
    borderWidth: 1,
    marginBottom: 14,
  },
  genreScroll: {
    marginBottom: 20,
  },
  genreChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  genreChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 11,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
