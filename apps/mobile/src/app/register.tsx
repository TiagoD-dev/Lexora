import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/providers/auth-provider';
import { Icon, type IconName } from '@/components/icon';
import { useAppTheme } from '@/providers/theme-provider';
import { ApiError } from '@/services/api-client';
import { radius, type ThemeColors } from '@/theme';

export default function RegisterScreen(){
  const router=useRouter();const {register}=useAuth();const {colors}=useAppTheme();const styles=makeStyles(colors);
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [role,setRole]=useState('');const [password,setPassword]=useState('');const [confirmation,setConfirmation]=useState('');const [accepted,setAccepted]=useState(false);const [error,setError]=useState('');const [submitting,setSubmitting]=useState(false);
  const submit=async()=>{
    const normalized=email.trim().toLowerCase();
    if(!name.trim()||!normalized||!password||!confirmation){setError('Preenche todos os campos obrigatórios.');return;}
    if(!/^\S+@\S+\.\S+$/.test(normalized)){setError('Introduz um endereço de email válido.');return;}
    if(password.length<8){setError('A palavra-passe deve ter pelo menos 8 caracteres.');return;}
    if(password!==confirmation){setError('As palavras-passe não coincidem.');return;}
    if(!accepted){setError('Confirma os termos para continuar.');return;}
    setError('');setSubmitting(true);
    try{
      await register({email:normalized,password,displayName:name.trim(),professionalTitle:role.trim()});
      router.replace('/home');
    }catch(err){setError(err instanceof ApiError?err.message:'Não foi possível criar a conta. Tenta novamente.');}
    finally{setSubmitting(false);}
  };
  const update=(setter:(value:string)=>void)=>(value:string)=>{setter(value);setError('');};
  return <AuthShell eyebrow="COMEÇA GRATUITAMENTE" title="Cria o teu espaço Lexora." description="Organiza o primeiro Caso, revê informação extraída e trabalha sempre com as fontes à vista."
    footer={<View style={styles.switchRow}><Text style={styles.switchText}>Já tens conta?</Text><Pressable accessibilityRole="button" onPress={()=>router.replace('/login')}><Text style={styles.switchAction}>Iniciar sessão</Text></Pressable></View>}>
    {error?<View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}
    <View style={styles.twoColumns}><Field label="Nome completo *" styles={styles}><TextInput accessibilityLabel="Nome completo" autoComplete="name" onChangeText={update(setName)} placeholder="O teu nome" placeholderTextColor={colors.placeholder} style={styles.input} value={name}/></Field><Field label="Função profissional" styles={styles}><TextInput accessibilityLabel="Função profissional" onChangeText={update(setRole)} placeholder="Ex.: Advogado" placeholderTextColor={colors.placeholder} style={styles.input} value={role}/></Field></View>
    <Field label="Email profissional *" styles={styles}><TextInput accessibilityLabel="Email profissional" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" onChangeText={update(setEmail)} placeholder="nome@escritorio.pt" placeholderTextColor={colors.placeholder} style={styles.input} value={email}/></Field>
    <View style={styles.twoColumns}><Field label="Palavra-passe *" styles={styles}><TextInput accessibilityLabel="Criar palavra-passe" autoCapitalize="none" autoComplete="new-password" onChangeText={update(setPassword)} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.placeholder} secureTextEntry style={styles.input} value={password}/></Field><Field label="Confirmar *" styles={styles}><TextInput accessibilityLabel="Confirmar palavra-passe" autoCapitalize="none" autoComplete="new-password" onChangeText={update(setConfirmation)} onSubmitEditing={submit} placeholder="Repete a palavra-passe" placeholderTextColor={colors.placeholder} secureTextEntry style={styles.input} value={confirmation}/></Field></View>
    <Pressable accessibilityRole="checkbox" accessibilityState={{checked:accepted}} onPress={()=>{setAccepted((current)=>!current);setError('');}} style={styles.consent}><View style={[styles.checkbox,accepted&&styles.checkboxChecked]}>{accepted?<Icon name="check" size={14} color={colors.white}/>:null}</View><Text style={styles.consentText}>Aceito os termos de utilização da Lexora e compreendo como os meus dados são tratados.</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={submitting} onPress={submit} style={({pressed})=>[styles.submit,(pressed||submitting)&&styles.pressed]}><Text style={styles.submitText}>{submitting?'A criar conta…':'Criar espaço gratuito'}</Text><Text style={styles.submitArrow}>→</Text></Pressable>
    <View style={styles.planNote}><Text style={styles.planBadge}>PLANO LOCAL</Text><Text style={styles.planText}>Sem cartão · Até 3 Casos ativos · Podes consultar os planos a qualquer momento</Text></View>
  </AuthShell>;
}

function Field({label,children,styles}:{label:string;children:React.ReactNode;styles:ReturnType<typeof makeStyles>}){return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>}
const makeStyles=(colors:ThemeColors)=>StyleSheet.create({field:{flex:1,gap:7},label:{color:colors.textStrong,fontSize:10,fontWeight:'800'},input:{minHeight:50,paddingHorizontal:14,borderWidth:1,borderColor:colors.borderStrong,borderRadius:radius.md,backgroundColor:colors.surface,color:colors.text,fontSize:12},twoColumns:{flexDirection:'row',flexWrap:'wrap',gap:12},consent:{flexDirection:'row',alignItems:'flex-start',gap:10,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.surface},checkbox:{width:19,height:19,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderStrong,borderRadius:6},checkboxChecked:{borderColor:colors.primary,backgroundColor:colors.primary},checkText:{color:colors.white,fontSize:10,fontWeight:'900'},consentText:{flex:1,color:colors.textMuted,fontSize:8,lineHeight:14},submit:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:24,borderRadius:radius.lg,backgroundColor:colors.primary},submitText:{color:colors.white,fontSize:11,fontWeight:'900'},submitArrow:{color:colors.accent,fontSize:17},pressed:{opacity:.7},errorBox:{padding:12,borderRadius:radius.md,backgroundColor:colors.warningBackground},errorText:{color:colors.danger,fontSize:9,lineHeight:14,fontWeight:'700'},switchRow:{flexDirection:'row',justifyContent:'center',gap:6},switchText:{color:colors.textMuted,fontSize:9},switchAction:{color:colors.primary,fontSize:9,fontWeight:'900'},planNote:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,padding:11,borderRadius:radius.md,backgroundColor:colors.primaryLight},planBadge:{paddingHorizontal:8,paddingVertical:5,borderRadius:radius.pill,color:colors.primary,backgroundColor:colors.surface,fontSize:7,fontWeight:'900'},planText:{flex:1,minWidth:190,color:colors.textMuted,fontSize:8,lineHeight:13}});
