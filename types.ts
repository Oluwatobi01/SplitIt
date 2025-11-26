
export interface User {
  id: string | number;
  name: string;
  handle: string;
  img: string;
  selected?: boolean;
}

export interface BillParticipant {
  userId: string | number;
  name: string;
  img: string;
  amount: number;
  paid: boolean;
}

export interface ReceiptItem {
  name: string;
  price: number;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  date: string;
  status: 'owe' | 'owed' | 'settled';
  category: string;
  description: string;
  payerId: string | number;
  participants: BillParticipant[];
  receiptItems?: ReceiptItem[];
}

export interface Group {
  id: string | number;
  name: string;
  created_by: string;
  img: string;
  members: User[];
  total_owe?: number;
  total_owed?: number;
}

export interface ScannedReceiptData {
  amount?: number;
  description?: string;
  category?: string;
  items?: ReceiptItem[];
}

// Navigation State Types
export interface SplitWithLocationState {
  participants?: User[];
  preservedData?: {
      amount: string;
      description: string;
      category: string;
      scannedData?: ScannedReceiptData;
  };
}

export interface SplitBillLocationState {
  participants?: User[];
  scannedData?: ScannedReceiptData;
  preservedData?: SplitWithLocationState['preservedData'];
}
