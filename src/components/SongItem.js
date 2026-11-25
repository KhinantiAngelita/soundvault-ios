import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
  const handleOptionsPress = () => {
    Alert.alert(
      song.title,
      'Pilih tindakan untuk lagu ini:',
      [
        {
          text: isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit',
          onPress: () => onToggleFavorite(song.id),
        },
        {
          text: 'Ganti Nama Lagu',
          onPress: () => onRename(song),
        },
        {
          text: 'Hapus Lagu',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Hapus Lagu?',
              `File "${song.title}" akan dihapus permanen dari penyimpanan iPhone.`,
              [
                { text: 'Batal', style: 'cancel' },
                { text: 'Hapus', style: 'destructive', onPress: () => onDelete(song.id) },
              ]
            );
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  return (
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
          onPress={handleOptionsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
});
