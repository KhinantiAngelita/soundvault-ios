import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CENURA_FONT } from '../utils/theme';
import { hapticSelection } from '../utils/haptics';

const NAV_ITEMS = [
  {
    key: 'library',
    label: 'Pustaka',
    icon: 'musical-notes-outline',
    activeIcon: 'musical-notes',
  },
  {
    key: 'playlists',
    label: 'Playlist',
    icon: 'albums-outline',
    activeIcon: 'albums',
  },
  {
    key: 'favorites',
    label: 'Favorit',
    icon: 'heart-outline',
    activeIcon: 'heart',
  },
];

function BottomNavbar({ activeNav, onSelectNav, theme }) {
  const isLight = theme.mode === 'light';

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isLight ? '#FFFFFF' : '#0E131B',
          borderTopColor: theme.border,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active = activeNav === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tabBtn}
            onPress={() => {
              if (!active) {
                hapticSelection();
                onSelectNav(item.key);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={22}
              color={active ? theme.accentStrong : theme.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active ? theme.accent : theme.textMuted,
                  fontWeight: active ? '600' : '500',
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontFamily: CENURA_FONT,
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.1,
  },
});

export default memo(BottomNavbar);
