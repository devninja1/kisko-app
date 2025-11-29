export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomerToSave {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}