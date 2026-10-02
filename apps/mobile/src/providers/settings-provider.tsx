import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';
import type { ProfileFields } from '@/services/auth-service';

export type AppSettings = {
  displayName: string; email: string; language: 'Português';
  professionalTitle: string; organization: string; phone: string;
  barNumber: string; primaryLegalArea: string; bio: string;
  taskNotifications: boolean; deadlineNotifications: boolean; legalUpdates: boolean;
  biometricLock: boolean; analytics: boolean; confidentialMode: boolean;
};
const defaults: AppSettings = {
  displayName: '', email: '', language: 'Português',
  professionalTitle: '', organization: '', phone: '', barNumber: '', primaryLegalArea: '', bio: '',
  taskNotifications: true, deadlineNotifications: true, legalUpdates: true,
  biometricLock: false, analytics: false, confidentialMode: false,
};
type SettingsContextValue = { settings: AppSettings; hydrated: boolean; updateSettings: (patch: Partial<AppSettings>) => Promise<void> };
const SettingsContext = createContext<SettingsContextValue | null>(null); const STORAGE_KEY='@lexora/settings/v1';
// O perfil vem da conta no servidor; o resto (notificações, privacidade) são preferências deste dispositivo.
const PROFILE_KEYS: (keyof ProfileFields)[] = ['displayName', 'professionalTitle', 'organization', 'phone', 'barNumber', 'primaryLegalArea', 'bio'];
export function SettingsProvider({children}:{children:ReactNode}){
  const {user,updateProfile}=useAuth();
  const [local,setLocal]=useState(defaults);const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then((raw)=>{if(raw)setLocal({...defaults,...JSON.parse(raw)});}).catch(()=>undefined).finally(()=>setHydrated(true));},[]);
  const settings=useMemo<AppSettings>(()=>user?{...local,...Object.fromEntries(PROFILE_KEYS.map((key)=>[key,user[key]??''])),email:user.email}:local,[local,user]);
  const updateSettings=async(patch:Partial<AppSettings>)=>{
    const profilePatch=Object.fromEntries(Object.entries(patch).filter(([key])=>PROFILE_KEYS.includes(key as keyof ProfileFields))) as Partial<ProfileFields>;
    const localPatch=Object.fromEntries(Object.entries(patch).filter(([key])=>!PROFILE_KEYS.includes(key as keyof ProfileFields)&&key!=='email'));
    if(Object.keys(localPatch).length)setLocal((current)=>{const next={...current,...localPatch};AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(next)).catch(()=>undefined);return next});
    if(Object.keys(profilePatch).length)await updateProfile(profilePatch);
  };
  const value=useMemo(()=>({settings,hydrated:hydrated&&!!user,updateSettings}),[settings,hydrated,user]);// eslint-disable-line react-hooks/exhaustive-deps
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>}
export function useSettings(){const value=useContext(SettingsContext);if(!value)throw new Error('useSettings deve ser usado dentro de SettingsProvider');return value}
