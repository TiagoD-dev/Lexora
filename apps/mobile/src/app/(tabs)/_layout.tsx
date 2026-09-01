import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { TopNavigationActions } from '@/components/top-navigation-actions';
import { radius, type ThemeColors } from '@/theme';

const menuIcons: Record<string, string> = {
  home: '⌂',
  clients: '◇',
  cases: '□',
  tasks: '✓',
  documents: '▤',
  assistant: '✦',
  sources: '§',
  alerts: '◉',
  profile: '○',
};

export default function SidebarLayout() {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const hasPermanentSidebar = width >= 900;
  return (
    <Drawer
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={({ route }) => ({
        drawerType: hasPermanentSidebar ? 'permanent' : 'front',
        drawerActiveBackgroundColor: colors.primaryLight,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle: styles.drawerLabel,
        drawerItemStyle: styles.drawerItem,
        drawerStyle: styles.drawer,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => <TopNavigationActions />,
        sceneStyle: { backgroundColor: colors.background },
        drawerIcon: ({ color }) => (
          <Text style={[styles.menuIcon, { color }]}>{menuIcons[route.name] ?? '·'}</Text>
        ),
      })}
    >
      <Drawer.Screen name="home" options={{ drawerLabel: 'Hoje', title: 'Hoje' }} />
      <Drawer.Screen name="clients" options={{ drawerLabel: 'Clientes', title: 'Clientes' }} />
      <Drawer.Screen name="cases" options={{ drawerLabel: 'Casos', title: 'Casos' }} />
      <Drawer.Screen name="tasks" options={{ drawerLabel: 'Tarefas e prazos', title: 'Tarefas' }} />
      <Drawer.Screen name="documents" options={{ drawerLabel: 'Documentos', title: 'Documentos' }} />
      <Drawer.Screen name="assistant" options={{ drawerLabel: 'Assistente Lexora', title: 'Assistente' }} />
      <Drawer.Screen name="sources" options={{ drawerLabel: 'Fontes jurídicas', title: 'Fontes' }} />
      <Drawer.Screen name="alerts" options={{ drawerLabel: 'Atualidade jurídica', title: 'Atualidade' }} />
      <Drawer.Screen name="profile" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: 'Definições', title: 'Definições' }} />
      <Drawer.Screen name="profile/edit" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: 'Editar perfil', title: 'Editar perfil' }} />
      <Drawer.Screen name="billing" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: 'Planos', title: 'Planos' }} />
    </Drawer>
  );
}

function SidebarContent(props: DrawerContentComponentProps) {
  const { colors } = useAppTheme(); const styles = makeStyles(colors);
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.sidebarContent}>
      <View style={styles.brandBlock}>
        <View style={styles.brandLogoSurface}>
          <Image
            accessibilityLabel="Lexora"
            resizeMode="contain"
            source={require('../../../assets/brand/lexora-logo.png')}
            style={styles.brandLogo}
          />
        </View>
        <Text style={styles.tagline}>Clareza jurídica digital</Text>
      </View>

      <View style={styles.menu}>
        <Text style={styles.menuTitle}>NAVEGAÇÃO</Text>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.sidebarNotice}>
        <Text style={styles.noticeTitle}>Espaço privado</Text>
        <Text style={styles.noticeText}>Os casos ficam associados à tua conta Lexora.</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  drawer: { width: 286, backgroundColor: colors.surface },
  sidebarContent: { flexGrow: 1, paddingTop: 0 },
  brandBlock: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandLogoSurface: {
    width: 230, height: 72, overflow: 'hidden', borderRadius: radius.md,
    backgroundColor: '#F7F4EB',
  },
  brandLogo: { position: 'absolute', top: -34, left: -10, width: 250, height: 140 },
  tagline: { marginTop: -2, marginLeft: 5, color: colors.textMuted, fontSize: 10 },
  menu: { flex: 1, paddingTop: 20 },
  menuTitle: {
    marginBottom: 8,
    paddingHorizontal: 28,
    color: colors.textSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  drawerItem: { minHeight: 43, borderRadius: radius.md, marginHorizontal: 12, marginVertical: 1 },
  drawerLabel: { marginLeft: -12, fontSize: 14, fontWeight: '600' },
  menuIcon: { width: 22, fontSize: 19, textAlign: 'center' },
  header: { backgroundColor: colors.background },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sidebarNotice: {
    margin: 18,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },
  noticeTitle: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  noticeText: { marginTop: 5, color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
