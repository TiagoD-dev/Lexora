import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppSettings = {
  displayName: string; email: string; language: 'Português';
  professionalTitle: string; organization: string; phone: string;
  barNumber: string; primaryLegalArea: string; bio: string;
  taskNotifications: boolean; deadlineNotifications: boolean; legalUpdates: boolean;
  biometricLock: boolean; analytics: boolean; confidentialMode: boolean;
};
const defaults: AppSettings = {
  displayName: 'Tiago', email: 'tiago@exemplo.pt', language: 'Português',
  professionalTitle: '', organization: '', phone: '', barNumber: '', primaryLegalArea: '', bio: '',
  taskNotifications: true, deadlineNotifications: true, legalUpdates: true,
  biometricLock: false, analytics: false, confidentialMode: false,
};
type SettingsContextValue = { settings: AppSettings; hydrated: boolean; updateSettings: (patch: Partial<AppSettings>) => void };
const SettingsContext = createContext<SettingsContextValue | null>(null); const STORAGE_KEY='@lexora/settings/v1';
export function SettingsProvider({children}:{children:ReactNode}){const [settings,setSettings]=useState(defaults);const [hydrated,setHydrated]=useState(false);useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then((raw)=>{if(raw)setSettings({...defaults,...JSON.parse(raw)});}).catch(()=>undefined).finally(()=>setHydrated(true))},[]);const updateSettings=(patch:Partial<AppSettings>)=>setSettings((current)=>{const next={...current,...patch};AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(next)).catch(()=>undefined);return next});const value=useMemo(()=>({settings,hydrated,updateSettings}),[settings,hydrated]);return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>}
export function useSettings(){const value=useContext(SettingsContext);if(!value)throw new Error('useSettings deve ser usado dentro de SettingsProvider');return value}
