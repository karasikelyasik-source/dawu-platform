export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  guests: number;
  startTime: string;
  endTime: string;
  status: string;
  tableId?: string | null;
  checkedInAt?: string | null;
  table?: {
    id: string;
    number: number;
  } | null;
};