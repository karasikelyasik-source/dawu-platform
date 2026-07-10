export type ReservationTable = {
  id: string;
  number: number;
  label?: string | null;
  seats?: number;
  status?: string;
};

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
  table?: ReservationTable | null;
};

export type RestaurantTable = {
  id: string;
  number: number;
  label?: string | null;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
};

export type CheckInResponse = {
  success: boolean;
  message?: string;
  reservation?: Reservation;
};