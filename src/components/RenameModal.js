import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

export default function RenameModal({ visible, song, onClose, onSave }) {
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (song) {
      setNewTitle(song.title);
    }
  }, [song]);

  const handleSave = () => {
    if (newTitle.trim()) {
      onSave(song.id, newTitle.trim());
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
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Ganti Nama Lagu</Text>
          <Text style={styles.subtitle}>
            Sesuaikan judul lagu agar rapi di daftar putar.
          </Text>

          <TextInput
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Masukkan judul lagu..."
            placeholderTextColor="#6B7280"
            autoFocus
            selectTextOnFocus
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E28',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  title: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#13131A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
