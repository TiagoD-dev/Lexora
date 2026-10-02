import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { FormProgress, FormRow, FormSection } from '@/components/form-section';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { SelectField } from '@/components/select-field';
import { LEGAL_AREAS } from '@/constants/legal-areas';
import { PROFESSIONAL_ROLES } from '@/constants/professional-roles';
import { useSettings } from '@/providers/settings-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { hashTheme } from '@/utils/palette';

export function EditProfileScreen() {
  const router = useRouter();
  const { settings, hydrated, updateSettings } = useSettings();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [name, setName] = useState(settings.displayName);
  const [professionalTitle, setProfessionalTitle] = useState(settings.professionalTitle);
  const [organization, setOrganization] = useState(settings.organization);
  const [phone, setPhone] = useState(settings.phone);
  const [barNumber, setBarNumber] = useState(settings.barNumber);
  const [primaryLegalArea, setPrimaryLegalArea] = useState(settings.primaryLegalArea);
  const [bio, setBio] = useState(settings.bio);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // As definições carregam de forma assíncrona; sincroniza os campos assim que os valores reais chegarem.
  useEffect(() => {
    if (!hydrated) return;
    setName(settings.displayName);
    setProfessionalTitle(settings.professionalTitle);
    setOrganization(settings.organization);
    setPhone(settings.phone);
    setBarNumber(settings.barNumber);
    setPrimaryLegalArea(settings.primaryLegalArea);
    setBio(settings.bio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const normalizedName = name.trim();
  const profileFields = [normalizedName, professionalTitle.trim(), organization.trim(), phone.trim(), barNumber.trim(), primaryLegalArea, bio.trim()];
  const profileLabels = ['nome', 'função', 'organização', 'telefone', 'cédula', 'área', 'apresentação'];
  const nameError = normalizedName ? '' : 'Indica o nome a apresentar.';
  const isValid = !nameError;
  const hasChanges = useMemo(
    () => normalizedName !== settings.displayName
      || professionalTitle.trim() !== settings.professionalTitle
      || organization.trim() !== settings.organization
      || phone.trim() !== settings.phone
      || barNumber.trim() !== settings.barNumber
      || primaryLegalArea !== settings.primaryLegalArea
      || bio.trim() !== settings.bio,
    [barNumber, bio, normalizedName, organization, phone, primaryLegalArea, professionalTitle, settings],
  );

  const initials = normalizedName.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'U';
  const avatarTheme = hashTheme(colors, normalizedName || 'utilizador');

  const save = async () => {
    setSubmitted(true);
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await updateSettings({
      displayName: normalizedName,
      professionalTitle: professionalTitle.trim(),
      organization: organization.trim(),
      phone: phone.trim(),
      barNumber: barNumber.trim(),
      primaryLegalArea,
      bio: bio.trim(),
      });
    } catch (error) {
      Alert.alert('Não foi possível guardar', error instanceof Error ? error.message : 'Verifica a ligação e tenta novamente.');
      return;
    } finally {
      setSaving(false);
    }
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
            <View accessibilityLabel={`Avatar de ${normalizedName || 'utilizador'}`} style={[styles.avatar, { backgroundColor: avatarTheme.bg }]}>
              <Text style={[styles.avatarText, { color: avatarTheme.fg }]}>{initials}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>PRÉ-VISUALIZAÇÃO DO PERFIL</Text>
              <Text numberOfLines={1} style={styles.heroName}>{normalizedName || 'O teu perfil'}</Text>
              <Text numberOfLines={1} style={styles.heroMeta}>{[professionalTitle.trim() || 'Adiciona a tua função profissional', organization.trim()].filter(Boolean).join(' · ')}</Text>
              <FormProgress done={profileFields.filter(Boolean).length} total={profileFields.length} missing={profileLabels.filter((_, index) => !profileFields[index])} />
            </View>
          </View>

          <FormSection step={1} icon="card-account-details-outline" title="Identidade" hint="Nome e email apresentados na Lexora." done={isValid}>
            <FormRow>
              <View>
                <AppInput
                  autoCapitalize="words"
                  autoComplete="name"
                  label="Nome *"
                  maxLength={80}
                  onChangeText={setName}
                  placeholder="Nome apresentado"
                  returnKeyType="next"
                  textContentType="name"
                  value={name}
                />
                {submitted && nameError ? <Text style={styles.error}>{nameError}</Text> : null}
              </View>
              <AppInput editable={false} label="Email" value={settings.email} />
            </FormRow>
            <Text style={styles.note}>
              O email é o da tua conta e é usado para iniciar sessão; não pode ser alterado aqui.
            </Text>
          </FormSection>

          <FormSection step={2} icon="briefcase-outline" title="Perfil profissional" hint="Função, organização e área de prática." done={!!(professionalTitle && organization.trim() && primaryLegalArea && barNumber.trim())}>
            <FormRow>
              <SelectField label="Função" value={professionalTitle || 'Selecionar função'} options={PROFESSIONAL_ROLES} onChange={setProfessionalTitle} />
              <AppInput label="Sociedade ou organização" maxLength={120} onChangeText={setOrganization} placeholder="Nome da organização (opcional)" value={organization} />
            </FormRow>
            <FormRow>
              <SelectField label="Área jurídica principal" value={primaryLegalArea || 'Selecionar área'} options={LEGAL_AREAS} onChange={setPrimaryLegalArea} />
              <AppInput autoCapitalize="characters" label="Cédula profissional" maxLength={40} onChangeText={setBarNumber} placeholder="Número ou referência (opcional)" value={barNumber} />
            </FormRow>
          </FormSection>

          <FormSection step={3} icon="card-account-phone-outline" title="Contacto e apresentação" hint="Como te podem contactar e uma breve apresentação." done={!!(phone.trim() && bio.trim())}>
            <AppInput autoComplete="tel" inputMode="tel" keyboardType="phone-pad" label="Telefone" maxLength={30} onChangeText={setPhone} placeholder="Ex.: +351 912 345 678" textContentType="telephoneNumber" value={phone} />
            <AppInput label="Apresentação" maxLength={280} multiline onChangeText={setBio} placeholder="Uma breve descrição da tua experiência e forma de trabalhar" value={bio} />
            <Text style={styles.counter}>{bio.length}/280</Text>
            <View style={styles.privacyBox}>
              <Icon name="shield-lock-outline" size={18} color={colors.primary} />
              <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Guardado na tua conta</Text><Text style={styles.note}>O perfil fica associado à tua conta Lexora e aparece em qualquer dispositivo onde inicies sessão.</Text></View>
            </View>
          </FormSection>

          <View style={styles.actions}><AppButton disabled={!hasChanges || saving} onPress={save}>{saving ? 'A guardar…' : 'Guardar alterações'}</AppButton></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 20 },
  content: { gap: 16, paddingBottom: 45 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, borderLeftColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.surface },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  avatarText: { fontSize: 22, fontWeight: '900' },
  heroCopy: { flex: 1, gap: 6 },
  heroEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  heroMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  error: { marginTop: 7, color: colors.danger, fontSize: 12, fontWeight: '600' },
  counter: { marginTop: -12, color: colors.textSoft, fontSize: 11, textAlign: 'right' },
  privacyBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.primaryLight },
  privacyCopy: { flex: 1 },
  privacyTitle: { marginBottom: 2, color: colors.primary, fontSize: 12, fontWeight: '800' },
  actions: { marginTop: 6 },
});
