import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { parseLocalDate } from '@/utils/deadlines';

export function TopNavigationActions() {
  const router = useRouter();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const { cases } = useCases();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = makeStyles(colors);
  const [menuOpen, setMenuOpen] = useState(false);
  const showIdentity = width >= 720;
  const initial = settings.displayName.trim().charAt(0).toUpperCase() || 'U';
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const notificationCount = cases.flatMap((item) => item.tasks).filter((task) => {
    if (task.completed || !task.dueDate) return false;
    const due = parseLocalDate(task.dueDate); if (!due) return false;
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    return days < 0 || task.reminderDays.includes(days);
  }).length;

  const navigate = (path: '/tasks' | '/profile' | '/profile/edit' | '/billing') => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <View style={styles.actions}>
      <Pressable accessibilityLabel={`${notificationCount} notificações de prazos`} accessibilityRole="button" onPress={() => navigate('/tasks')} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Text style={styles.icon}>◉</Text>
        {notificationCount ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text></View> : null}
      </Pressable>

      <Pressable accessibilityLabel="Definições" accessibilityRole="button" onPress={() => navigate('/profile')} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>

      <View style={styles.separator} />

      <Pressable accessibilityLabel="Abrir menu do perfil" accessibilityRole="button" onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        {showIdentity ? <View style={styles.identity}><Text numberOfLines={1} style={styles.name}>{settings.displayName}</Text><Text numberOfLines={1} style={styles.role}>{settings.professionalTitle || 'O meu perfil'}</Text></View> : null}
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal animationType="fade" onRequestClose={() => setMenuOpen(false)} transparent visible={menuOpen}>
        <Pressable accessibilityLabel="Fechar menu do perfil" onPress={() => setMenuOpen(false)} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}><Text style={styles.menuAvatarText}>{initial}</Text></View>
              <View style={styles.menuIdentity}><Text numberOfLines={1} style={styles.menuName}>{settings.displayName}</Text><Text numberOfLines={1} style={styles.menuEmail}>{settings.email}</Text></View>
            </View>
            <View style={styles.divider} />
            <MenuItem symbol="○" label="Perfil" detail="Ver e editar os teus dados" onPress={() => navigate('/profile/edit')} styles={styles} />
            <MenuItem symbol="◇" label="Planos" detail="Comparar funcionalidades e preços" onPress={() => navigate('/billing')} styles={styles} />
            <MenuItem symbol="×" label="Terminar sessão" danger onPress={() => {
              setMenuOpen(false);
              logout().finally(() => {
                if (Platform.OS === 'web') { window.location.href = '/login'; return; }
                router.replace('/login');
              });
            }} styles={styles} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ symbol, label, detail, danger, onPress, styles }: { symbol: string; label: string; detail?: string; danger?: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return <Pressable accessibilityRole="menuitem" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}><Text style={[styles.menuSymbol, danger && styles.danger]}>{symbol}</Text><View style={styles.menuCopy}><Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>{detail ? <Text style={styles.menuDetail}>{detail}</Text> : null}</View><Text style={[styles.menuArrow, danger && styles.danger]}>›</Text></Pressable>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 12 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  icon: { color: colors.textMuted, fontSize: 19 },
  settingsIcon: { color: colors.textMuted, fontSize: 20 },
  notificationBadge: { position: 'absolute', top: 3, right: 2, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: colors.background, borderRadius: 9, backgroundColor: colors.danger },
  notificationBadgeText: { color: colors.white, fontSize: 7, fontWeight: '900' },
  separator: { width: 1, height: 28, marginHorizontal: 4, backgroundColor: colors.border },
  profileButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 5, borderRadius: radius.lg },
  avatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.primary },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  identity: { width: 104 },
  name: { color: colors.textStrong, fontSize: 11, fontWeight: '800' },
  role: { marginTop: 1, color: colors.textSoft, fontSize: 9 },
  chevron: { color: colors.textSoft, fontSize: 16 },
  pressed: { opacity: .6, backgroundColor: colors.surfaceMuted },
  backdrop: { flex: 1, alignItems: 'flex-end', paddingTop: 58, paddingRight: 18, backgroundColor: 'rgba(5, 12, 25, 0.16)' },
  menu: { width: 288, padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface, boxShadow: '0 8px 20px rgba(0,0,0,0.16)', elevation: 12 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9 },
  menuAvatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  menuAvatarText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  menuIdentity: { flex: 1 },
  menuName: { color: colors.textStrong, fontSize: 13, fontWeight: '800' },
  menuEmail: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  divider: { height: 1, marginVertical: 7, backgroundColor: colors.border },
  menuItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, borderRadius: radius.md },
  menuItemPressed: { backgroundColor: colors.primaryLight },
  menuSymbol: { width: 22, color: colors.primary, fontSize: 18, textAlign: 'center' },
  menuCopy: { flex: 1 },
  menuLabel: { color: colors.textStrong, fontSize: 12, fontWeight: '700' },
  menuDetail: { marginTop: 2, color: colors.textSoft, fontSize: 9 },
  menuArrow: { color: colors.textSoft, fontSize: 19 },
  danger: { color: colors.danger },
});
