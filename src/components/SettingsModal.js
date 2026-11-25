import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatFileSize } from '../utils/formatters';
import { CENURA_FONT } from '../utils/theme';

export const SORT_OPTIONS = [
  {
    key: 'newest',
    label: 'Terbaru Ditambahkan',
    icon: 'time-outline',
  },
  {
    key: 'oldest',
    label: 'Terlama Ditambahkan',
    icon: 'calendar-clear-outline',
  },
  {
    key: 'az',
    label: 'Judul (A – Z)',
    icon: 'arrow-down-outline',
  },
  {
    key: 'za',
    label: 'Judul (Z – A)',
    icon: 'arrow-up-outline',
  },
];

export default function SettingsModal({
  visible,
  onClose,
  theme,
  themeMode,
  onSelectTheme,
  sortOrder,
  onSelectSortOrder,
  totalSongs = 0,
  totalBytes = 0,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header Settings */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Pengaturan
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.doneTextBtn, { color: theme.accent }]}>
                Selesai
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bagian 1: Tema Aplikasi (iOS Grouped Segmented Control: Sistem / Gelap / Terang) */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            TEMA
          </Text>
          <View
            style={[
              styles.themeSegmentBox,
              {
                backgroundColor: theme.surfaceElevated,
              },
            ]}
          >
            {[
              { key: 'system', label: 'Sistem', icon: 'phone-portrait-outline', size: 14 },
              { key: 'dark', label: 'Gelap', icon: 'moon-outline', size: 14 },
              { key: 'light', label: 'Terang', icon: 'sunny-outline', size: 15 },
            ].map((opt) => {
              const active = themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeOptionBtn,
                    active && [
                      styles.themeOptionActive,
                      { backgroundColor: theme.surface },
                    ],
                  ]}
                  onPress={() => onSelectTheme(opt.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={opt.icon}
                    size={opt.size}
                    color={active ? theme.text : theme.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color: active ? theme.text : theme.textSecondary,
                        fontWeight: active ? '600' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bagian 2: Urutan Lagu (iOS Native List dengan Leading Icon Tanpa Kotak) */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            URUTKAN LAGU
          </Text>
          <View
            style={[
              styles.groupContainer,
              {
                backgroundColor: theme.surfaceElevated,
              },
            ]}
          >
            {SORT_OPTIONS.map((item, idx) => {
              const isSelected = sortOrder === item.key;
              const isLast = idx === SORT_OPTIONS.length - 1;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.groupRow}
                  onPress={() => onSelectSortOrder(item.key)}
                  activeOpacity={0.65}
                >
                  {/* Leading Icon Bersih Ala Apple SF Symbols (Tanpa Kotak Latar) */}
                  <View style={styles.leadingIconWrap}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isSelected ? theme.accent : theme.textSecondary}
                    />
                  </View>

                  {/* Teks & Garis Pemisah Inset Ala iOS */}
                  <View
                    style={[
                      styles.rowContentWrap,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupRowTitle,
                        {
                          color: theme.text,
                          fontWeight: isSelected ? '500' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={19}
                        color={theme.accent}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bagian 3: Info Penyimpanan Minimalis */}
          <View
            style={[
              styles.groupContainer,
              {
                backgroundColor: theme.surfaceElevated,
                marginBottom: 4,
              },
            ]}
          >
            <View style={styles.groupRow}>
              <View style={styles.leadingIconWrap}>
                <Ionicons
                  name="folder-outline"
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
              <View style={styles.rowContentWrap}>
                <Text style={[styles.groupRowTitle, { color: theme.text }]}>
                  Penyimpanan Lokal
                </Text>
                <Text style={[styles.storageVal, { color: theme.textSecondary }]}>
                  {totalSongs} lagu • {formatFileSize(totalBytes)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  closeBtn: {
    paddingVertical: 2,
    paddingLeft: 8,
  },
  doneTextBtn: {
    fontFamily: CENURA_FONT,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionLabel: {
    fontFamily: CENURA_FONT,
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: 7,
    marginLeft: 4,
  },
  themeSegmentBox: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 18,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  themeOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  themeOptionText: {
    fontSize: 13.5,
  },
  groupContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
  },
  leadingIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowContentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 14,
  },
  groupRowTitle: {
    fontFamily: CENURA_FONT,
    fontSize: 14.5,
  },
  storageVal: {
    fontFamily: CENURA_FONT,
    fontSize: 14,
  },
});
