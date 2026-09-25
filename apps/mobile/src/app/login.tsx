import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Icon, type IconName } from '@/components/icon';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { ApiError } from '@/services/api-client';
import { radius, type ThemeColors } from '@/theme';

export default function LoginScreen(){
  const router=useRouter();const {login}=useAuth();const {colors}=useAppTheme();const styles=makeStyles(colors);
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [showPassword,setShowPassword]=useState(false);const [error,setError]=useState('');const [submitting,setSubmitting]=useState(false);
  const passwordRef=useRef<TextInput>(null);
  const submittingRef=useRef(false);
  const submit=async()=>{
    if(submittingRef.current)return;
    const normalized=email.trim().toLowerCase();
    if(!normalized||!password){setError('Preenche o email e a palavra-passe para continuar.');return;}
    if(!/^\S+@\S+\.\S+$/.test(normalized)){setError('Introduz um endereço de email válido.');return;}
    setError('');submittingRef.current=true;setSubmitting(true);
    try{await login(normalized,password);router.replace('/home');}
    catch(err){setError(err instanceof ApiError?err.message:'Não foi possível iniciar sessão. Tenta novamente.');}
    finally{submittingRef.current=false;setSubmitting(false);}
  };
  return <AuthShell eyebrow="BEM-VINDO DE VOLTA" title="Entra no teu espaço Lexora." description="Acesso reservado a advogados, solicitadores e sociedades de advogados."
    footer={<View style={styles.footer}>
      <View style={styles.notice}><Icon name="gavel" size={16} color={colors.accent}/><Text style={styles.noticeText}>Pensada para o sigilo profissional previsto no <Text style={styles.noticeStrong}>Estatuto da Ordem dos Advogados</Text> e para as regras do RGPD.</Text></View>
      <View style={styles.switchRow}><Text style={styles.switchText}>Ainda não tens credenciais?</Text><Pressable accessibilityRole="button" onPress={()=>router.push('/register')}><Text style={styles.switchAction}>Criar conta ›</Text></Pressable></View>
    </View>}>
    <View style={styles.badge}><Icon name="shield-check-outline" size={14} color={colors.warningText}/><Text style={styles.badgeText}>Portal do Mandatário</Text></View>
    <View style={styles.card}>
      {error?<View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}
      <Field label="Email profissional" styles={styles}><View style={styles.inputBox}><Icon name="email-outline" size={20} color={colors.textSoft}/><TextInput accessibilityLabel="Email profissional" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" onChangeText={(value)=>{setEmail(value);setError('');}} placeholder="advogado@escritorio.pt" placeholderTextColor={colors.placeholder} returnKeyType="next" onSubmitEditing={()=>passwordRef.current?.focus()} submitBehavior="submit" style={styles.input} value={email}/></View></Field>
      <Field label="Palavra-passe" styles={styles} action={<Pressable accessibilityRole="button" onPress={()=>Alert.alert('Recuperar acesso','A recuperação segura será disponibilizada com a autenticação cloud.')}><Text style={styles.forgot}>Esqueceste a palavra-passe?</Text></Pressable>}><View style={styles.inputBox}><Icon name="lock-outline" size={20} color={colors.textSoft}/><TextInput ref={passwordRef} accessibilityLabel="Palavra-passe" autoCapitalize="none" autoComplete="password" onChangeText={(value)=>{setPassword(value);setError('');}} onSubmitEditing={submit} placeholder="••••••••••" placeholderTextColor={colors.placeholder} returnKeyType="done" secureTextEntry={!showPassword} style={styles.input} value={password}/><Pressable accessibilityLabel={showPassword?'Ocultar palavra-passe':'Mostrar palavra-passe'} accessibilityRole="button" onPress={()=>setShowPassword((current)=>!current)} hitSlop={10}><Icon name={(showPassword?'eye-off-outline':'eye-outline') as IconName} size={20} color={colors.textSoft}/></Pressable></View></Field>
      <Text style={styles.rememberText}>A sessão mantém-se neste dispositivo até terminares sessão.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={submit} style={({pressed})=>[styles.submit,(pressed||submitting)&&styles.pressed]}><Text style={styles.submitText}>{submitting?'A entrar…':'Entrar na Lexora'}</Text><Icon name="arrow-right" size={18} color={colors.white}/></Pressable>
    </View>
  </AuthShell>;
}

function Field({label,action,children,styles}:{label:string;action?:React.ReactNode;children:React.ReactNode;styles:ReturnType<typeof makeStyles>}){return <View style={styles.field}><View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{action}</View>{children}</View>}
const makeStyles=(colors:ThemeColors)=>StyleSheet.create({badge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:5,borderRadius:radius.pill,backgroundColor:colors.warningBackground},badgeText:{color:colors.warningText,fontSize:11,fontWeight:'800'},card:{gap:16,padding:20,borderWidth:1,borderColor:colors.border,borderRadius:radius.xl,backgroundColor:colors.surface},field:{gap:7},labelRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8},label:{color:colors.textStrong,fontSize:13,fontWeight:'800'},inputBox:{minHeight:52,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,borderWidth:1,borderColor:colors.borderStrong,borderRadius:radius.md,backgroundColor:colors.background},input:{flex:1,minHeight:50,color:colors.text,fontSize:16},rememberText:{color:colors.textMuted,fontSize:12},forgot:{color:colors.primary,fontSize:12,fontWeight:'800'},submit:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,borderRadius:radius.lg,backgroundColor:'#7A1620'},submitText:{color:colors.white,fontSize:15,fontWeight:'900'},pressed:{opacity:.7},errorBox:{padding:12,borderRadius:radius.md,backgroundColor:colors.warningBackground},errorText:{color:colors.danger,fontSize:13,lineHeight:20,fontWeight:'700'},footer:{gap:16},notice:{flexDirection:'row',gap:10,padding:14,borderRadius:radius.md,backgroundColor:colors.warningBackground},noticeText:{flex:1,color:colors.textMuted,fontSize:12,lineHeight:18},noticeStrong:{color:colors.textStrong,fontWeight:'800'},switchRow:{flexDirection:'row',justifyContent:'center',flexWrap:'wrap',gap:6},switchText:{color:colors.textMuted,fontSize:13},switchAction:{color:colors.primary,fontSize:13,fontWeight:'900'}});
