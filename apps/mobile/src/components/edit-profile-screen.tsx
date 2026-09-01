import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { ScreenHeader } from '@/components/screen-header';
import { SelectField } from '@/components/select-field';
import { LEGAL_AREAS } from '@/constants/legal-areas';
import { PROFESSIONAL_ROLES } from '@/constants/professional-roles';
import { useSettings } from '@/providers/settings-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditProfileScreen() {
  const router = useRouter();
  const { settings, hydrated, updateSettings } = useSettings();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [name, setName] = useState(settings.displayName);
  const [email, setEmail] = useState(settings.email);
  const [professionalTitle, setProfessionalTitle] = useState(settings.professionalTitle);
  const [organization, setOrganization] = useState(settings.organization);
  const [phone, setPhone] = useState(settings.phone);
  const [barNumber, setBarNumber] = useState(settings.barNumber);
  const [primaryLegalArea, setPrimaryLegalArea] = useState(settings.primaryLegalArea);
  const [bio, setBio] = useState(settings.bio);
  const [submitted, setSubmitted] = useState(false);

  // As definições carregam de forma assíncrona; sincroniza os campos assim que os valores reais chegarem.
  useEffect(() => {
    if (!hydrated) return;
    setName(settings.displayName);
    setEmail(settings.email);
    setProfessionalTitle(settings.professionalTitle);
    setOrganization(settings.organization);
    setPhone(settings.phone);
    setBarNumber(settings.barNumber);
    setPrimaryLegalArea(settings.primaryLegalArea);
    setBio(settings.bio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const profileFields = [normalizedName, normalizedEmail, professionalTitle.trim(), organization.trim(), phone.trim(), barNumber.trim(), primaryLegalArea, bio.trim()];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const nameError = normalizedName ? '' : 'Indica o nome a apresentar.';
  const emailError = EMAIL_PATTERN.test(normalizedEmail) ? '' : 'Indica um email válido.';
  const isValid = !nameError && !emailError;
  const hasChanges = useMemo(
    () => normalizedName !== settings.displayName
      || normalizedEmail !== settings.email.toLowerCase()
      || professionalTitle.trim() !== settings.professionalTitle
      || organization.trim() !== settings.organization
      || phone.trim() !== settings.phone
      || barNumber.trim() !== settings.barNumber
      || primaryLegalArea !== settings.primaryLegalArea
      || bio.trim() !== settings.bio,
    [barNumber, bio, normalizedEmail, normalizedName, organization, phone, primaryLegalArea, professionalTitle, settings],
  );

  const save = () => {
    setSubmitted(true);
    if (!isValid) return;

    updateSettings({
      displayName: normalizedName,
      email: normalizedEmail,
      professionalTitle: professionalTitle.trim(),
      organization: organization.trim(),
      phone: phone.trim(),
      barNumber: barNumber.trim(),
      primaryLegalArea,
      bio: bio.trim(),
    });
    Alert.alert('Perfil atualizado', 'As alterações foram guardadas neste dispositivo.');
    router.replace('/profile');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <ScreenHeader title="Editar perfil" subtitle="Informação visível na Lexora" />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View accessibilityLabel={`Avatar de ${normalizedName || 'utilizador'}`} style={styles.avatar}>
              <Text style={styles.avatarText}>{normalizedName.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>{normalizedName || 'O teu perfil'}</Text>
              <Text style={styles.heroMeta}>{professionalTitle.trim() || 'Adiciona a tua função profissional'}</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profileCompletion}%` }]} /></View>
              <Text style={styles.progressLabel}>Perfil {profileCompletion}% completo</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Identidade</Text>
          <View style={styles.card}>
            <View>
              <AppInput
                autoCapitalize="words"
                autoComplete="name"
                label="Nome"
                maxLength={80}
                onChangeText={setName}
                placeholder="Nome apresentado"
                returnKeyType="next"
                textContentType="name"
                value={name}
              />
              {submitted && nameError ? <Text style={styles.error}>{nameError}</Text> : null}
            </View>

            <View>
              <AppInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                inputMode="email"
                keyboardType="email-address"
                label="Email"
                maxLength={254}
                onChangeText={setEmail}
                onSubmitEditing={save}
                placeholder="nome@exemplo.pt"
                returnKeyType="done"
                textContentType="emailAddress"
                value={email}
              />
              {submitted && emailError ? <Text style={styles.error}>{emailError}</Text> : null}
            </View>
            <Text style={styles.note}>
              O email identifica o perfil nesta versão local. Alterá-lo não modifica credenciais de autenticação.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Perfil profissional</Text>
          <View style={styles.card}>
            <SelectField label="Função" value={professionalTitle || 'Selecionar função'} options={PROFESSIONAL_ROLES} onChange={setProfessionalTitle} />
            <AppInput label="Sociedade ou organização" maxLength={120} onChangeText={setOrganization} placeholder="Nome da organização (opcional)" value={organization} />
            <SelectField label="Área jurídica principal" value={primaryLegalArea || 'Selecionar área'} options={LEGAL_AREAS} onChange={setPrimaryLegalArea} />
            <AppInput autoCapitalize="characters" label="Cédula profissional" maxLength={40} onChangeText={setBarNumber} placeholder="Número ou referência (opcional)" value={barNumber} />
          </View>

          <Text style={styles.sectionLabel}>Contacto e apresentação</Text>
          <View style={styles.card}>
            <AppInput autoComplete="tel" inputMode="tel" keyboardType="phone-pad" label="Telefone" maxLength={30} onChangeText={setPhone} placeholder="Ex.: +351 912 345 678" textContentType="telephoneNumber" value={phone} />
            <AppInput label="Apresentação" maxLength={280} multiline onChangeText={setBio} placeholder="Uma breve descrição da tua experiência e forma de trabalhar" value={bio} />
            <Text style={styles.counter}>{bio.length}/280</Text>
            <View style={styles.privacyBox}>
              <Text style={styles.privacyIcon}>⌁</Text>
              <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Guardado localmente</Text><Text style={styles.note}>Estes dados ficam neste dispositivo e podem ser alterados a qualquer momento.</Text></View>
            </View>
          </View>

          <View style={styles.actions}><AppButton disabled={!hasChanges} onPress={save}>Guardar alterações</AppButton></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: 20 },
  content: { paddingBottom: 45 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: radius.xl, backgroundColor: colors.primary },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xxl,
    backgroundColor: colors.primarySoft,
  },
  avatarText: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  heroCopy: { flex: 1 },
  heroName: { color: colors.white, fontSize: 19, fontWeight: '900' },
  heroMeta: { marginTop: 3, color: colors.primarySoft, fontSize: 11 },
  progressTrack: { height: 5, marginTop: 14, borderRadius: 3, backgroundColor: colors.primaryLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  progressLabel: { marginTop: 6, color: colors.primarySoft, fontSize: 9, fontWeight: '700' },
  sectionLabel: { marginTop: 24, marginBottom: 9, color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: .9, textTransform: 'uppercase' },
  card: { gap: 18, padding: 19, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  error: { marginTop: 7, color: colors.danger, fontSize: 11, fontWeight: '600' },
  counter: { marginTop: -12, color: colors.textSoft, fontSize: 9, textAlign: 'right' },
  privacyBox: { flexDirection: 'row', gap: 12, padding: 13, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  privacyIcon: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  privacyCopy: { flex: 1 },
  privacyTitle: { marginBottom: 2, color: colors.primary, fontSize: 11, fontWeight: '800' },
  actions: { marginTop: 22 },
});
