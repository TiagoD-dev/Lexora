export type ClientType = 'Particular' | 'Empresa';
export type ClientStatus = 'Ativo' | 'Inativo';

export type Client = {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  nif: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientDraft = Pick<Client, 'name' | 'type' | 'status' | 'nif' | 'email' | 'phone' | 'address' | 'notes'>;
