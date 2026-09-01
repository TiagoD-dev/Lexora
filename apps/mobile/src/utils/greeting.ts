export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 20) return 'Boa tarde';
  return 'Boa noite';
}

// Tratamento académico por função. Funções sem forma de género própria (ex.: "Jurista",
// "Paralegal", "Agente de Execução") ou sem grau académico associado ficam sem abreviatura.
const PROFESSIONAL_HONORIFICS: Record<string, 'Dr.' | 'Dra.'> = {
  'advogado': 'Dr.',
  'advogada': 'Dra.',
  'advogado estagiário': 'Dr.',
  'advogada estagiária': 'Dra.',
  'solicitador': 'Dr.',
  'solicitadora': 'Dra.',
  'consultor jurídico': 'Dr.',
  'consultora jurídica': 'Dra.',
  'notário': 'Dr.',
  'notária': 'Dra.',
  'conservador': 'Dr.',
  'conservadora': 'Dra.',
  'administrador de insolvência': 'Dr.',
  'administradora de insolvência': 'Dra.',
  'árbitro': 'Dr.',
  'árbitra': 'Dra.',
};

export function professionalHonorific(professionalTitle: string): 'Dr.' | 'Dra.' | null {
  const normalized = professionalTitle.trim().toLocaleLowerCase('pt-PT');
  return PROFESSIONAL_HONORIFICS[normalized] ?? null;
}

export function homeGreeting(professionalTitle: string, firstName: string, date = new Date()): string {
  const greeting = timeOfDayGreeting(date);
  const title = professionalHonorific(professionalTitle);
  return title ? `${greeting}, ${title} ${firstName}` : `${greeting}, ${firstName}`;
}
