import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/services/api-client';
import { createCheckoutSession, type PlanId } from '@/services/billing-service';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';
import { hashTheme } from '@/utils/palette';

type BillingCycle = 'monthly' | 'annual';

const plans = [
  {
    id: 'local',
    name: 'Local',
    symbol: '○',
    description: 'Para experimentar a organização jurídica num único dispositivo.',
    monthly: 0,
    featured: false,
    features: ['Até 3 Casos ativos', 'Tarefas e prazos', 'Documentos guardados localmente', 'Assistente em modo limitado'],
  },
  {
    id: 'pro',
    name: 'Pro',
    symbol: '◆',
    description: 'Para profissionais que querem usar a Lexora no trabalho diário.',
    monthly: 19.9,
    featured: true,
    features: ['Casos e clientes ilimitados', 'Extração e revisão de documentos', 'Assistente contextual por Caso', 'Prazos, recorrência e notificações', 'Exportação e cópias de segurança'],
  },
  {
    id: 'office',
    name: 'Escritório',
    symbol: '▤',
    description: 'Para escritórios que precisam de colaboração, controlo e segurança.',
    monthly: 89.9,
    featured: false,
    features: ['Até 10 utilizadores incluídos', 'Espaço partilhado do escritório', 'Permissões e histórico de atividade', 'Modelos e identidade do escritório', 'Utilizadores adicionais por 9,90 €/mês', 'Suporte prioritário'],
  },
] as const;

export function PlansContent() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  const requestPlan = async (planId: PlanId, name: string) => {
    try {
      const { url } = await createCheckoutSession(planId, cycle);
      await Linking.openURL(url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 501) {
        Alert.alert(`Plano ${name}`, 'A faturação Stripe ainda não está configurada nesta instância (falta a conta e as chaves).');
        return;
      }
      Alert.alert(`Plano ${name}`, 'Não foi possível iniciar o checkout. Tenta novamente.');
    }
  };

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LEXORA PARA PROFISSIONAIS</Text>
        <Text style={styles.heroTitle}>Clareza jurídica que cresce contigo.</Text>
        <Text style={styles.heroText}>Começa localmente e evolui para um espaço seguro, sincronizado e preparado para equipas.</Text>
        <View style={styles.cycleSwitch}>
          <CycleOption active={cycle === 'monthly'} label="Mensal" onPress={() => setCycle('monthly')} styles={styles} />
          <CycleOption active={cycle === 'annual'} label="Anual · poupa 20%" onPress={() => setCycle('annual')} styles={styles} />
        </View>
      </View>

      <View style={styles.planGrid}>
        {plans.map((plan) => {
          const price = cycle === 'annual' ? plan.monthly * .8 : plan.monthly;
          const icon = hashTheme(colors, plan.id);
          return <View key={plan.id} style={[styles.planCard, plan.featured && styles.planCardFeatured]}>
            <View style={styles.planTop}>
              <View style={[styles.planIcon, { backgroundColor: icon.bg }]}><Text style={[styles.planIconText, { color: icon.fg }]}>{plan.symbol}</Text></View>
              {plan.featured ? <Text style={styles.popular}>RECOMENDADO</Text> : null}
            </View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{price === 0 ? 'Grátis' : `${price.toFixed(2).replace('.', ',')} €`}</Text>
              {price > 0 ? <Text style={styles.period}>/mês{cycle === 'annual' ? ' · faturado anualmente' : ''}</Text> : null}
            </View>
            <View style={styles.features}>{plan.features.map((feature) => <View key={feature} style={styles.feature}><Text style={styles.check}>✓</Text><Text style={styles.featureText}>{feature}</Text></View>)}</View>
            <Pressable
              accessibilityRole="button"
              disabled={plan.id === 'local'}
              onPress={() => requestPlan(plan.id as PlanId, plan.name)}
              style={({ pressed }) => [styles.cta, plan.featured && styles.ctaFeatured, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaText, plan.featured && styles.ctaTextFeatured]}>{plan.id === 'local' ? 'Plano atual' : plan.id === 'pro' ? 'Escolher Pro' : 'Falar connosco'}</Text>
            </Pressable>
          </View>;
        })}
      </View>

      <View style={styles.trustCard}>
        <Text style={styles.trustTitle}>O que tem de existir antes de cobrar</Text>
        <View style={styles.trustGrid}>
          <TrustItem title="Conta segura" text="Autenticação real, recuperação de acesso e sessões protegidas." styles={styles} />
          <TrustItem title="Dados cifrados" text="Sincronização, cópias de segurança e política de retenção transparente." styles={styles} />
          <TrustItem title="Faturação" text="Checkout, IVA, faturas, cancelamento e gestão de subscrição." styles={styles} />
        </View>
      </View>

      <Text style={styles.legal}>Valores sem IVA e apresentados sem compromisso comercial. O processamento de pagamentos ainda não está ativo.</Text>
    </>
  );
}

function CycleOption({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.cycleOption, active && styles.cycleOptionActive]}><Text style={[styles.cycleText, active && styles.cycleTextActive]}>{label}</Text></Pressable>;
}

function TrustItem({ title, text, styles }: { title: string; text: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.trustItem}><Text style={styles.trustItemTitle}>{title}</Text><Text style={styles.trustText}>{text}</Text></View>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  hero: { alignItems: 'center', padding: 28, borderRadius: radius.xxl, backgroundColor: '#7A1620' }, eyebrow: { color: '#B4872B', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, heroTitle: { marginTop: 12, color: '#F7F1E4', fontSize: 30, fontWeight: '900', textAlign: 'center' }, heroText: { maxWidth: 620, marginTop: 10, color: '#DDB0AC', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  cycleSwitch: { flexDirection: 'row', marginTop: 22, padding: 4, borderRadius: radius.pill, backgroundColor: colors.primaryLight }, cycleOption: { paddingHorizontal: 17, paddingVertical: 10, borderRadius: radius.pill }, cycleOptionActive: { backgroundColor: colors.surface }, cycleText: { color: colors.primarySoft, fontSize: 10, fontWeight: '800' }, cycleTextActive: { color: colors.primary },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 16, marginTop: 22 }, planCard: { minWidth: 250, flex: 1, padding: 22, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xxl, backgroundColor: colors.surface }, planCardFeatured: { borderWidth: 2, borderColor: colors.accent }, planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, planIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md }, planIconText: { fontSize: 17, fontWeight: '700' }, popular: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, color: colors.text, backgroundColor: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: .8 }, planName: { color: colors.textStrong, fontSize: 21, fontWeight: '900' }, planDescription: { minHeight: 55, marginTop: 8, color: colors.textMuted, fontSize: 11, lineHeight: 17 }, priceRow: { minHeight: 54, flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 5, marginTop: 16 }, price: { color: colors.primary, fontSize: 27, fontWeight: '900' }, period: { paddingBottom: 5, color: colors.textSoft, fontSize: 8 }, features: { flex: 1, gap: 10, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }, feature: { flexDirection: 'row', gap: 9 }, check: { color: colors.successText, fontSize: 12, fontWeight: '900' }, featureText: { flex: 1, color: colors.textMuted, fontSize: 10, lineHeight: 15 }, cta: { minHeight: 45, alignItems: 'center', justifyContent: 'center', marginTop: 22, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md }, ctaFeatured: { backgroundColor: colors.primary }, ctaText: { color: colors.primary, fontSize: 11, fontWeight: '900' }, ctaTextFeatured: { color: colors.white }, pressed: { opacity: .65 },
  trustCard: { marginTop: 22, padding: 22, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, backgroundColor: colors.surface }, trustTitle: { color: colors.textStrong, fontSize: 17, fontWeight: '900' }, trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 }, trustItem: { minWidth: 210, flex: 1, padding: 15, borderRadius: radius.md, backgroundColor: colors.background }, trustItemTitle: { color: colors.primary, fontSize: 12, fontWeight: '900' }, trustText: { marginTop: 6, color: colors.textMuted, fontSize: 10, lineHeight: 16 }, legal: { marginTop: 22, color: colors.textSoft, fontSize: 9, textAlign: 'center' },
});
