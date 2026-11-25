import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatFileSize } from '../utils/formatters';

export default function SongItem({
  song,
  isPlaying,
  isCurrentSong,
  isFavorite,
  onPress,
  onToggleFavorite,
  onRename,
  onDelete,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isCurrentSong && styles.containerActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, isCurrentSong && styles.iconBoxActive]}>
          <Ionicons
            name={isCurrentSong ? (isPlaying ? 'musical-notes' : 'pause') : 'musical-note'}
            size={22}
            color={isCurrentSong ? '#8B5CF6' : '#9CA3AF'}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.title, isCurrentSong && styles.titleActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {song.title}
          </Text>
          <Text style={styles.subtitle}>
            {formatFileSize(song.size)} • Penyimpanan Lokal
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onToggleFavorite(song.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#EF4444' : '#6B7280'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* iOS Dark Action Sheet Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.sheetSubtitle}>Pilih tindakan untuk lagu ini</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setMenuVisible(false);
                onToggleFavorite(song.id);
              }}
            >
              <Ionicons
                name={isFavorite ? 'heart-dislike-outline' : 'heart-outline'}
                size={20}
                color="#E5E7EB"
              />
              <Text style={styles.sheetOptionText}>
                {isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setMenuVisible(false);
                onRename(song);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#E5E7EB" />
              <Text style={styles.sheetOptionText}>Ganti Nama Lagu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setMenuVisible(false);
                setConfirmDeleteVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>
                Hapus Lagu dari Penyimpanan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Konfirmasi Hapus Lagu */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Hapus Lagu?</Text>
            <Text style={styles.confirmText}>
              File &quot;{song.title}&quot; akan dihapus permanen dari daftar penyimpanan.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  onDelete(song.id);
                }}
              >
                <Text style={styles.confirmDeleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#181820',
    marginBottom: 8,
  },
  containerActive: {
    backgroundColor: '#232035',
    borderWidth: 1,
    borderColor: '#8B5CF655',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#262632',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxActive: {
    backgroundColor: '#8B5CF622',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleActive: {
    color: '#A78BFA',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1E28',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  sheetHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
    paddingBottom: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  sheetOptionText: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  sheetCancelBtn: {
    marginTop: 8,
    backgroundColor: '#2A2A38',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1E28',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  confirmCancelText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDelete: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
