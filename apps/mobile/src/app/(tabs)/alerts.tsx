import { useMemo, useState } from 'react'; import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'; import { SafeAreaView } from 'react-native-safe-area-context';
import { useLegalUpdates } from '@/providers/legal-updates-provider'; import { Icon, type IconName } from '@/components/icon'; import { EmptyState } from '@/components/empty-state'; import { kindIcon, LegalUpdateCard } from '@/components/legal-update-card'; import { FilterChip, SearchBox, StatTiles } from '@/components/list-kit';
import { useAppTheme } from '@/providers/theme-provider'; import { radius, type ThemeColors } from '@/theme'; import type { LegalUpdate } from '@/types/legal-update';

type Kind = 'Todas' | LegalUpdate['sourceKind'];
const kinds: Kind[] = ['Todas', 'Portugal', 'União Europeia', 'Jurisprudência'];
const icons: Record<Kind, IconName> = { Todas: 'newspaper-variant-outline', ...kindIcon };

export default function AlertsScreen(){
  const {updates,hydrated,error,refresh}=useLegalUpdates(); const {colors}=useAppTheme(); const styles=makeStyles(colors);
  const [query,setQuery]=useState(''); const [kind,setKind]=useState<Kind>('Todas');
  const count=(k:Kind)=>k==='Todas'?updates.length:updates.filter((item)=>item.sourceKind===k).length;
  const visible=useMemo(()=>{const q=query.trim().toLocaleLowerCase('pt-PT');return updates.filter((item)=>(kind==='Todas'||item.sourceKind===kind)&&(!q||`${item.title} ${item.summary} ${item.source} ${item.areas.join(' ')}`.toLocaleLowerCase('pt-PT').includes(q))).sort((a,b)=>(b.publishedAt??'').localeCompare(a.publishedAt??''));},[updates,query,kind]);
  return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.intro}><View style={styles.introCopy}><Text style={styles.eyebrow}>MONITORIZAÇÃO</Text><Text style={styles.title}>Atualidade jurídica</Text><Text style={styles.subtitle}>Publicações oficiais nacionais, da União Europeia e jurisprudência de referência.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Atualizar publicações" onPress={refresh} style={({pressed})=>[styles.refresh,pressed&&styles.pressed]}><Icon name="refresh" size={17} color={colors.primary}/><Text style={styles.refreshText}>Atualizar</Text></Pressable></View>
    <StatTiles items={[{icon:'newspaper-variant-outline',value:updates.length,label:'Publicações'},{icon:kindIcon.Portugal,value:count('Portugal'),label:'Diário da República'},{icon:kindIcon['União Europeia'],value:count('União Europeia'),label:'União Europeia'},{icon:kindIcon.Jurisprudência,value:count('Jurisprudência'),label:'Jurisprudência'}]}/>
    <View style={styles.notice}><Icon name="shield-check-outline" size={18} color={colors.primary}/><Text style={styles.noticeText}>Resumos informativos. Confirma sempre o texto na fonte original antes de o aplicar.</Text></View>
    <SearchBox label="Pesquisar publicações" value={query} onChange={setQuery} placeholder="Pesquisar por tema, diploma ou área…"/>
    <View style={styles.filters}>{kinds.map((k)=><FilterChip key={k} icon={icons[k]} label={k} count={count(k)} active={kind===k} onPress={()=>setKind(k)}/>)}</View>
    {!hydrated?<View style={styles.state}><ActivityIndicator color={colors.primary}/><Text style={styles.stateText}>A consultar fontes oficiais…</Text></View>
      :error?<View style={styles.state}><Icon name="cloud-off-outline" size={28} color={colors.textSoft}/><Text style={styles.stateText}>Não foi possível obter as publicações agora.</Text><Pressable onPress={refresh}><Text style={styles.stateRetry}>Tentar novamente</Text></Pressable></View>
      :visible.length===0?<EmptyState symbol="newspaper-variant-outline" title={updates.length?'Nenhuma publicação encontrada':'Sem publicações de momento'} description={updates.length?'Altera o filtro ou a pesquisa.':'Volta a tentar mais tarde.'}/>
      :<View style={styles.list}>{visible.map((update)=><LegalUpdateCard key={update.id} update={update}/>)}</View>}
  </ScrollView></SafeAreaView>;
}

const makeStyles=(colors:ThemeColors)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  content:{width:'100%',maxWidth:1000,alignSelf:'center',gap:14,paddingHorizontal:20,paddingBottom:42},
  intro:{flexDirection:'row',flexWrap:'wrap',alignItems:'flex-end',justifyContent:'space-between',gap:14,paddingTop:24,paddingBottom:8},
  introCopy:{flexShrink:1},
  eyebrow:{color:colors.accent,fontSize:10,fontWeight:'800',letterSpacing:1.2},
  title:{marginTop:5,color:colors.text,fontSize:28,fontWeight:'800'},
  subtitle:{maxWidth:650,marginTop:6,color:colors.textMuted,fontSize:13,lineHeight:19},
  refresh:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:16,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.surface},
  refreshText:{color:colors.primary,fontSize:13,fontWeight:'800'},
  pressed:{opacity:.75},
  notice:{flexDirection:'row',alignItems:'center',gap:10,padding:14,borderRadius:radius.lg,backgroundColor:colors.primaryLight},
  noticeText:{flex:1,color:colors.textStrong,fontSize:12,lineHeight:18},
  filters:{flexDirection:'row',flexWrap:'wrap',gap:8},
  state:{alignItems:'center',gap:10,paddingVertical:60},
  stateText:{color:colors.textMuted,fontSize:13,textAlign:'center'},
  stateRetry:{color:colors.primary,fontSize:13,fontWeight:'800'},
  list:{marginTop:6,flexDirection:'row',flexWrap:'wrap',gap:12},
});
