export interface Customer {
  id: number;
  customerId: number;
  name: string;
  phone_number: string;
  place: string;
  type: string;
  is_active: boolean;
  display_order: number;
  date_added: string; // ISO string from backend
}