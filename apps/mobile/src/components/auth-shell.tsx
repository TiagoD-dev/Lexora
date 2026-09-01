import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/providers/theme-provider';
import { radius, type ThemeColors } from '@/theme';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const showStory = width >= 900;

  return <SafeAreaView style={styles.screen}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
    <ScrollView key={eyebrow} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.workspace}>
        <View style={styles.formPane}>
          <View style={styles.formHeader}>
            <Pressable accessibilityLabel="Voltar à página inicial" accessibilityRole="button" onPress={() => router.replace('/')} style={({pressed})=>[styles.back,pressed&&styles.pressed]}><Text style={styles.backText}>‹</Text><Text style={styles.backLabel}>Página inicial</Text></Pressable>
            <View style={styles.logoSurface}><Image accessibilityLabel="Lexora" resizeMode="contain" source={require('../../assets/brand/lexora-logo.png')} style={styles.logoImage}/></View>
          </View>
          <View style={styles.formContent}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.form}>{children}</View>
            <View style={styles.footer}>{footer}</View>
            <View style={styles.privacy}><Text style={styles.privacyIcon}>⌾</Text><Text style={styles.privacyText}>Os teus Casos e Clientes ficam associados à tua conta e disponíveis em qualquer dispositivo onde inicies sessão.</Text></View>
          </View>
        </View>

        {showStory ? <View style={styles.storyPane}>
          <View style={styles.storyTexture}/>
          <View style={styles.storyContent}>
            <Text style={styles.storyEyebrow}>TRABALHO JURÍDICO COM CONTEXTO</Text>
            <Text style={styles.storyTitle}>Cada facto merece uma fonte. Cada decisão merece confiança.</Text>
            <Text style={styles.storyText}>A Lexora reúne documentos, factos e questões dentro do respetivo Caso — com revisão profissional em todos os pontos importantes.</Text>
            <View style={styles.promiseList}>
              <Promise title="Fontes sempre visíveis" text="Documento, excerto e localização acompanham cada facto." styles={styles}/>
              <Promise title="Contexto isolado por Caso" text="O Assistente utiliza apenas a informação confirmada desse assunto." styles={styles}/>
              <Promise title="Controlo permanece contigo" text="A Lexora organiza e sugere; o profissional revê e decide." styles={styles}/>
            </View>
          </View>
          <View style={styles.storyFooter}><Text style={styles.storyFooterMark}>L</Text><Text style={styles.storyFooterText}>Clareza jurídica digital</Text><Text style={styles.storyFooterMeta}>Portugal · 2026</Text></View>
        </View> : null}
      </View>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

function Promise({ title, text, styles }: { title: string; text: string; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.promise}><View style={styles.promiseCheck}><Text style={styles.promiseCheckText}>✓</Text></View><View style={styles.promiseCopy}><Text style={styles.promiseTitle}>{title}</Text><Text style={styles.promiseText}>{text}</Text></View></View>; }

const makeStyles=(colors:ThemeColors)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},keyboard:{flex:1},scroll:{flexGrow:1},workspace:{width:'100%',maxWidth:1440,minHeight:'100%',alignSelf:'center',flexDirection:'row'},formPane:{flex:1,minWidth:0,backgroundColor:colors.background},formHeader:{minHeight:92,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:30},back:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:10},backText:{color:colors.primary,fontSize:25,lineHeight:25},backLabel:{color:colors.textMuted,fontSize:10,fontWeight:'700'},pressed:{opacity:.65},logoSurface:{width:174,height:50,overflow:'hidden',borderRadius:radius.md,backgroundColor:'#F7F4EB'},logoImage:{position:'absolute',top:-27,left:0,width:174,height:98},formContent:{width:'100%',maxWidth:540,alignSelf:'center',paddingHorizontal:30,paddingTop:46,paddingBottom:45},eyebrow:{color:colors.accent,fontSize:8,fontWeight:'900',letterSpacing:1.1},title:{marginTop:11,color:colors.text,fontSize:34,lineHeight:40,fontWeight:'900'},description:{maxWidth:480,marginTop:10,color:colors.textMuted,fontSize:12,lineHeight:19},form:{gap:15,marginTop:28},footer:{marginTop:23},privacy:{flexDirection:'row',gap:10,marginTop:28,paddingTop:20,borderTopWidth:1,borderTopColor:colors.border},privacyIcon:{color:colors.primary,fontSize:13},privacyText:{flex:1,color:colors.textSoft,fontSize:8,lineHeight:14},
  storyPane:{width:'46%',minHeight:720,position:'relative',overflow:'hidden',justifyContent:'space-between',padding:54,backgroundColor:'#12372A'},storyTexture:{position:'absolute',top:-120,right:-100,width:440,height:440,borderWidth:80,borderColor:'#1D4939',borderRadius:220,opacity:.75},storyContent:{maxWidth:510,marginTop:90},storyEyebrow:{color:'#D9B96E',fontSize:8,fontWeight:'900',letterSpacing:1.2},storyTitle:{marginTop:17,color:'#F5F2E9',fontSize:34,lineHeight:42,fontWeight:'900'},storyText:{marginTop:15,color:'#BFD8C8',fontSize:11,lineHeight:19},promiseList:{gap:18,marginTop:38},promise:{flexDirection:'row',gap:13},promiseCheck:{width:28,height:28,alignItems:'center',justifyContent:'center',borderRadius:radius.pill,backgroundColor:'#D9B96E'},promiseCheckText:{color:'#12372A',fontSize:11,fontWeight:'900'},promiseCopy:{flex:1,paddingTop:1},promiseTitle:{color:'#F5F2E9',fontSize:11,fontWeight:'900'},promiseText:{maxWidth:390,marginTop:4,color:'#9FC5AF',fontSize:9,lineHeight:15},storyFooter:{flexDirection:'row',alignItems:'center',gap:10,paddingTop:25,borderTopWidth:1,borderTopColor:'#315846'},storyFooterMark:{width:28,height:28,color:'#12372A',backgroundColor:'#D9B96E',borderRadius:8,fontSize:14,fontWeight:'900',lineHeight:28,textAlign:'center'},storyFooterText:{flex:1,color:'#BFD8C8',fontSize:9,fontWeight:'700'},storyFooterMeta:{color:'#749986',fontSize:8},
});
