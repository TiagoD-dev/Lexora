import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
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
  return <AuthShell eyebrow="BEM-VINDO DE VOLTA" title="Entra no teu espaço Lexora." description="Consulta os teus Casos, revê fontes e continua o trabalho exatamente onde o deixaste."
    footer={<View style={styles.switchRow}><Text style={styles.switchText}>Ainda não tens conta?</Text><Pressable accessibilityRole="button" onPress={()=>router.push('/register')}><Text style={styles.switchAction}>Criar conta gratuitamente</Text></Pressable></View>}>
    {error?<View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>:null}
    <Field label="Email profissional" styles={styles}><TextInput accessibilityLabel="Email profissional" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" onChangeText={(value)=>{setEmail(value);setError('');}} placeholder="nome@escritorio.pt" placeholderTextColor={colors.placeholder} returnKeyType="next" onSubmitEditing={()=>passwordRef.current?.focus()} submitBehavior="submit" style={styles.input} value={email}/></Field>
    <Field label="Palavra-passe" styles={styles}><View style={styles.passwordBox}><TextInput ref={passwordRef} accessibilityLabel="Palavra-passe" autoCapitalize="none" autoComplete="password" onChangeText={(value)=>{setPassword(value);setError('');}} onSubmitEditing={submit} placeholder="Introduz a tua palavra-passe" placeholderTextColor={colors.placeholder} returnKeyType="done" secureTextEntry={!showPassword} style={styles.passwordInput} value={password}/><Pressable accessibilityLabel={showPassword?'Ocultar palavra-passe':'Mostrar palavra-passe'} accessibilityRole="button" onPress={()=>setShowPassword((current)=>!current)} style={styles.showButton}><Text style={styles.showText}>{showPassword?'Ocultar':'Mostrar'}</Text></Pressable></View></Field>
    <View style={styles.formMeta}><Text style={styles.rememberText}>A sessão mantém-se neste dispositivo até terminares sessão.</Text><Pressable accessibilityRole="button" onPress={()=>Alert.alert('Recuperar acesso','A recuperação segura será disponibilizada com a autenticação cloud.')}><Text style={styles.forgot}>Recuperar acesso</Text></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={submit} style={({pressed})=>[styles.submit,(pressed||submitting)&&styles.pressed]}><Text style={styles.submitText}>{submitting?'A entrar…':'Iniciar sessão'}</Text><Text style={styles.submitArrow}>→</Text></Pressable>
  </AuthShell>;
}

function Field({label,children,styles}:{label:string;children:React.ReactNode;styles:ReturnType<typeof makeStyles>}){return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>}
const makeStyles=(colors:ThemeColors)=>StyleSheet.create({field:{gap:7},label:{color:colors.textStrong,fontSize:14,fontWeight:'800'},input:{minHeight:52,paddingHorizontal:15,borderWidth:1,borderColor:colors.borderStrong,borderRadius:radius.md,backgroundColor:colors.surface,color:colors.text,fontSize:16},passwordBox:{minHeight:52,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:colors.borderStrong,borderRadius:radius.md,backgroundColor:colors.surface},passwordInput:{flex:1,paddingHorizontal:15,color:colors.text,fontSize:16},showButton:{paddingHorizontal:14,paddingVertical:12},showText:{color:colors.primary,fontSize:13,fontWeight:'900'},formMeta:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10},rememberText:{color:colors.textMuted,fontSize:12},forgot:{color:colors.primary,fontSize:12,fontWeight:'900'},submit:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:24,borderRadius:radius.lg,backgroundColor:colors.primary},submitText:{color:colors.background,fontSize:15,fontWeight:'900'},submitArrow:{color:colors.background,fontSize:17},pressed:{opacity:.7},errorBox:{padding:12,borderRadius:radius.md,backgroundColor:colors.warningBackground},errorText:{color:colors.danger,fontSize:13,lineHeight:20,fontWeight:'700'},switchRow:{flexDirection:'row',justifyContent:'center',flexWrap:'wrap',gap:6},switchText:{color:colors.textMuted,fontSize:13},switchAction:{color:colors.primary,fontSize:13,fontWeight:'900'}});
