import { Fragment } from 'react'; import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'; import { SafeAreaView } from 'react-native-safe-area-context';
import { useLegalUpdates } from '@/providers/legal-updates-provider'; import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider'; import { radius, type ThemeColors } from '@/theme'; import { hashTheme } from '@/utils/palette'; import type { LegalUpdate } from '@/types/legal-update';

const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`)):'Fonte oficial';

export default function AlertsScreen(){
  const {updates,hydrated,error,refresh}=useLegalUpdates(); const {colors}=useAppTheme(); const styles=makeStyles(colors);
  const stats=[
    {value:String(updates.length),label:'Publicações acompanhadas'},
    {value:String(updates.filter((item)=>item.sourceKind==='Portugal').length),label:'Diário da República'},
    {value:String(updates.filter((item)=>item.sourceKind==='União Europeia').length),label:'União Europeia'},
  ];
  return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.intro}><View style={styles.introCopy}><Text style={styles.eyebrow}>MONITORIZAÇÃO</Text><Text style={styles.title}>Atualidade jurídica</Text><Text style={styles.subtitle}>Publicações oficiais nacionais, da União Europeia e jurisprudência de referência.</Text></View><Pressable accessibilityRole="button" onPress={refresh} style={styles.refresh}><Text style={styles.refreshText}>Atualizar</Text></Pressable></View>
    {hydrated&&updates.length>0?<View style={styles.hero}>{stats.map((stat,index)=><Fragment key={stat.label}>{index>0?<View style={styles.heroDivider}/>:null}<View style={styles.heroStat}><Text style={styles.heroValue}>{stat.value}</Text><Text style={styles.heroLabel}>{stat.label}</Text></View></Fragment>)}</View>:null}
    {!hydrated?<View style={styles.state}><ActivityIndicator color={colors.primary}/><Text style={styles.stateText}>A consultar fontes oficiais…</Text></View>
      :error?<View style={styles.state}><Text style={styles.stateText}>Não foi possível obter as publicações agora.</Text><Pressable onPress={refresh}><Text style={styles.stateRetry}>Tentar novamente</Text></Pressable></View>
      :updates.length===0?<View style={styles.state}><Text style={styles.stateText}>Sem publicações disponíveis de momento.</Text></View>
      :<View style={styles.list}>{updates.map((update)=><UpdateCard key={update.id} update={update} colors={colors} styles={styles}/>)}</View>}
  </ScrollView></SafeAreaView>;
}

function UpdateCard({update,colors,styles}:{update:LegalUpdate;colors:ThemeColors;styles:ReturnType<typeof makeStyles>}){
  const icon=hashTheme(colors,update.sourceKind); const symbol=update.sourceKind==='Portugal'?'DR':update.sourceKind==='União Europeia'?'UE':'§';
  return <Pressable accessibilityRole="link" onPress={()=>Linking.openURL(update.url)} style={({pressed})=>[styles.card,pressed&&styles.pressed]}>
    <View style={[styles.symbol,{backgroundColor:icon.bg}]}><Text style={[styles.symbolText,{color:icon.fg}]}>{symbol}</Text></View>
    <View style={styles.copy}>
      <View style={styles.copyTop}><Text style={styles.kind}>{update.sourceKind.toLocaleUpperCase('pt-PT')} · {update.source.toLocaleUpperCase('pt-PT')}</Text>{update.official?<Text style={styles.official}>VERIFICADA</Text>:null}</View>
      <Text numberOfLines={2} style={styles.cardTitle}>{update.title}</Text>
      <Text numberOfLines={1} style={styles.summary}>{update.summary}</Text>
      <Text style={styles.date}>{formatDate(update.publishedAt)}</Text>
    </View>
    <Icon name="open-in-new" size={16} color={colors.textSoft} />
  </Pressable>;
}

const makeStyles=(colors:ThemeColors)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  content:{width:'100%',maxWidth:900,alignSelf:'center',paddingHorizontal:20,paddingBottom:42},
  intro:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:18,paddingTop:24,paddingBottom:22},
  introCopy:{flex:1},
  eyebrow:{color:colors.accent,fontSize:10,fontWeight:'800',letterSpacing:1.2},
  title:{marginTop:5,color:colors.text,fontSize:30,fontWeight:'800'},
  subtitle:{maxWidth:650,marginTop:6,color:colors.textMuted,fontSize:13,lineHeight:19},
  refresh:{minHeight:44,justifyContent:'center',paddingHorizontal:16,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.surface},
  refreshText:{color:colors.primary,fontSize:12,fontWeight:'800'},
  hero:{flexDirection:'row',alignItems:'center',padding:20,borderRadius:radius.xxl,backgroundColor:colors.primary},
  heroStat:{flex:1,alignItems:'center'},
  heroValue:{color:colors.background,fontSize:26,fontWeight:'900'},
  heroLabel:{marginTop:3,color:colors.primarySoft,fontSize:10,fontWeight:'700',textTransform:'uppercase',letterSpacing:.6},
  heroDivider:{width:1,height:34,backgroundColor:colors.primaryLight,opacity:.35},
  state:{alignItems:'center',gap:10,paddingVertical:60},
  stateText:{color:colors.textMuted,fontSize:12,textAlign:'center'},
  stateRetry:{color:colors.primary,fontSize:12,fontWeight:'800'},
  list:{marginTop:22,flexDirection:'row',flexWrap:'wrap',gap:10},
  card:{flexGrow:1,flexBasis:280,minWidth:260,maxWidth:'100%',flexDirection:'row',alignItems:'flex-start',padding:12,borderWidth:1,borderColor:colors.border,borderRadius:radius.xl,backgroundColor:colors.surface},
  pressed:{opacity:.72},
  symbol:{width:34,height:34,alignItems:'center',justifyContent:'center',borderRadius:radius.md},
  symbolText:{fontSize:11,fontWeight:'900'},
  copy:{flex:1,marginHorizontal:10},
  copyTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
  kind:{color:colors.accent,fontSize:8,fontWeight:'900',letterSpacing:.6},
  official:{color:colors.successText,fontSize:8,fontWeight:'900'},
  cardTitle:{marginTop:4,color:colors.textStrong,fontSize:13,fontWeight:'700'},
  summary:{marginTop:3,color:colors.textMuted,fontSize:11,lineHeight:16},
  date:{marginTop:6,color:colors.textSoft,fontSize:9},
  chevron:{marginTop:2,color:colors.primary,fontSize:14},
});
