import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useCases } from '@/providers/cases-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { parseLocalDate } from '@/utils/deadlines';
import { sendDelayEmail } from '@/services/notifications-service';

export function TopNavigationActions() {
  const router = useRouter();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const { cases } = useCases();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = makeStyles(colors);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  useEffect(() => { AsyncStorage.getItem(SEEN_STORAGE_KEY).then((raw) => { if (raw) setSeenIds(JSON.parse(raw)); }).catch(() => undefined); }, []);
  const markSeen = (taskId: string) => setSeenIds((current) => {
    if (current.includes(taskId)) return current;
    const next = [...current, taskId];
    AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
    return next;
  });
  const showIdentity = width >= 720;
  const initial = settings.displayName.trim().charAt(0).toUpperCase() || 'U';
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const notifications = cases.flatMap((item) => item.tasks.map((task) => ({ task, caseId: item.id, caseTitle: item.title })))
    .filter(({ task }) => {
      if (task.completed || !task.dueDate) return false;
      const due = parseLocalDate(task.dueDate); if (!due) return false;
      const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
      return days < 0 || task.reminderDays.includes(days);
    })
    .sort((a, b) => (a.task.dueDate ?? '').localeCompare(b.task.dueDate ?? ''));
  const notificationCount = notifications.filter(({ task }) => !seenIds.includes(task.id)).length;

  useEffect(() => {
    const late = notifications.filter(({ task }) => {
      const due = parseLocalDate(task.dueDate!)!;
      return Math.ceil((due.getTime() - now.getTime()) / 86400000) < 0;
    });
    if (!late.length) return;
    AsyncStorage.getItem(EMAILED_STORAGE_KEY).then((raw) => {
      const emailed: string[] = raw ? JSON.parse(raw) : [];
      const toEmail = late.filter(({ task }) => !emailed.includes(task.id));
      if (!toEmail.length) return;
      Promise.all(toEmail.map(({ task, caseTitle }) => {
        const due = parseLocalDate(task.dueDate!)!;
        const daysLate = Math.abs(Math.ceil((due.getTime() - now.getTime()) / 86400000));
        return sendDelayEmail(task.title, caseTitle, daysLate).catch(() => undefined);
      })).then(() => {
        const next = [...emailed, ...toEmail.map(({ task }) => task.id)];
        AsyncStorage.setItem(EMAILED_STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      });
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.map(({ task }) => task.id).join(',')]);

  const navigate = (path: '/profile' | '/profile/edit' | '/billing') => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <View style={styles.actions}>
      <Pressable accessibilityLabel="Pesquisar casos e clientes" accessibilityRole="button" onPress={() => router.push('/search')} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Text style={styles.icon}>⌕</Text>
      </Pressable>

      <Pressable accessibilityLabel={`${notificationCount} notificações de prazos`} accessibilityRole="button" onPress={() => setNotifOpen(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
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

      <Modal animationType="fade" onRequestClose={() => setNotifOpen(false)} transparent visible={notifOpen}>
        <Pressable accessibilityLabel="Fechar notificações" onPress={() => setNotifOpen(false)} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.menu}>
            <View style={styles.menuHeader}><Text style={styles.menuTitle}>Notificações</Text></View>
            <View style={styles.divider} />
            {notifications.length ? notifications.map(({ task, caseId, caseTitle }) => {
              const due = parseLocalDate(task.dueDate!)!;
              const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
              const seen = seenIds.includes(task.id);
              const detail = `${caseTitle} · ${days < 0 ? `Atrasada ${Math.abs(days)}d` : days === 0 ? 'Vence hoje' : `Vence em ${days}d`}`;
              return (
                <MenuItem key={task.id} symbol={seen ? '✓' : '⏰'} label={task.title} detail={detail} danger={days < 0 && !seen} seen={seen}
                  onPress={() => { markSeen(task.id); setNotifOpen(false); router.push({ pathname: '/cases/[id]', params: { id: caseId } }); }} styles={styles} />
              );
            }) : <Text style={styles.emptyNotif}>Sem notificações de prazos.</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ symbol, label, detail, danger, seen, onPress, styles }: { symbol: string; label: string; detail?: string; danger?: boolean; seen?: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return <Pressable accessibilityRole="menuitem" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}><Text style={[styles.menuSymbol, danger && styles.danger, seen && styles.seen]}>{symbol}</Text><View style={styles.menuCopy}><Text style={[styles.menuLabel, danger && styles.danger, seen && styles.seen]}>{label}</Text>{detail ? <Text style={[styles.menuDetail, seen && styles.seen]}>{detail}</Text> : null}</View><Text style={[styles.menuArrow, danger && styles.danger]}>›</Text></Pressable>;
}

const SEEN_STORAGE_KEY = '@lexora/notifications/seen/v1';
const EMAILED_STORAGE_KEY = '@lexora/notifications/emailed/v1';

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
  menuTitle: { color: colors.textStrong, fontSize: 13, fontWeight: '800' },
  emptyNotif: { padding: 14, color: colors.textSoft, fontSize: 11, textAlign: 'center' },
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
  seen: { color: colors.textSoft },
});
