import type { Client } from '@/types/client';

export const mockClients: Client[] = [
  { id: 'client-maria', name: 'Maria Santos', type: 'Particular', status: 'Ativo', nif: '245 000 001', email: 'maria.santos@email.pt', phone: '+351 912 345 678', address: 'Lisboa', notes: 'Prefere contacto por email.', createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-30T10:00:00.000Z' },
  { id: 'client-joao', name: 'João Ferreira', type: 'Particular', status: 'Ativo', nif: '245 000 002', email: 'joao.ferreira@email.pt', phone: '+351 913 456 789', address: 'Porto', notes: '', createdAt: '2026-08-21T09:00:00.000Z', updatedAt: '2026-08-29T10:00:00.000Z' },
  { id: 'client-ana', name: 'Ana Costa', type: 'Particular', status: 'Ativo', nif: '', email: 'ana.costa@email.pt', phone: '', address: 'Coimbra', notes: '', createdAt: '2026-08-22T09:00:00.000Z', updatedAt: '2026-08-28T10:00:00.000Z' },
];
