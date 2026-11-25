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
  theme,
  isPlaying,
  isCurrentSong,
  isFavorite,
  onPress,
  onToggleFavorite,
  onEdit,
  onDelete,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const artistName = song.artist || 'Unknown Artist';
  const genreName = song.genre || 'Pop';

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: isCurrentSong ? theme.surfaceActive : theme.surface,
            borderColor: isCurrentSong ? theme.accentBorder : theme.borderSubtle,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {/* Icon / Playing Indicator */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isCurrentSong ? theme.accentSoft : theme.surfaceElevated,
              borderColor: isCurrentSong ? theme.accentBorder : 'transparent',
            },
          ]}
        >
          <Ionicons
            name={isCurrentSong ? (isPlaying ? 'stats-chart' : 'pause') : 'musical-note'}
            size={19}
            color={isCurrentSong ? theme.accent : theme.textSecondary}
          />
        </View>

        {/* Info Lagu: Judul, Artist, Genre Badge */}
        <View style={styles.infoContainer}>
          <Text
            style={[
              styles.title,
              { color: isCurrentSong ? theme.accent : theme.text },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {song.title}
          </Text>

          <View style={styles.metaRow}>
            <Text
              style={[styles.artistText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {artistName}
            </Text>
            <View style={[styles.dot, { backgroundColor: theme.textMuted }]} />
            <View
              style={[
                styles.genreBadge,
                {
                  backgroundColor: theme.accentSoft,
                  borderColor: theme.accentBorder,
                },
              ]}
            >
              <Text style={[styles.genreText, { color: theme.accent }]}>
                {genreName}
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: theme.textMuted }]} />
            <Text style={[styles.sizeText, { color: theme.textMuted }]}>
              {formatFileSize(song.size)}
            </Text>
          </View>
        </View>

        {/* Tombol Favorit & Menu */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onToggleFavorite(song.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={19}
              color={isFavorite ? theme.danger : theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Action Sheet Minimalis */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                {artistName} • {genreName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setMenuVisible(false);
                onEdit(song);
              }}
            >
              <Ionicons name="options-outline" size={20} color={theme.accent} />
              <Text style={[styles.sheetOptionText, { color: theme.text }]}>
                Edit Judul, Artist & Genre
              </Text>
            </TouchableOpacity>

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
                color={theme.textSecondary}
              />
              <Text style={[styles.sheetOptionText, { color: theme.text }]}>
                {isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setMenuVisible(false);
                setConfirmDeleteVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.sheetOptionText, { color: theme.danger }]}>
                Hapus Lagu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>
                Tutup
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Konfirmasi Hapus */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: theme.text }]}>
              Hapus Lagu?
            </Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              File &quot;{song.title}&quot; akan dihapus dari penyimpanan Anda.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: theme.textSecondary }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, { backgroundColor: theme.danger }]}
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
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
    borderWidth: 1,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  artistText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 120,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
    opacity: 0.6,
  },
  genreBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  genreText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  sizeText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  sheetHeader: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
  },
  sheetOptionText: {
    fontSize: 14.5,
    fontWeight: '500',
    marginLeft: 12,
  },
  sheetCancelBtn: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 18,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  confirmCancelText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  confirmDelete: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '600',
  },
});
