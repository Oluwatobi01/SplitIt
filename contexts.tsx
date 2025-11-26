
import { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { Bill, User } from './types';

// --- Theme Context ---
export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// --- Auth Context ---
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// --- Bills Data Context ---
export interface BillsContextType {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  users: User[];
  currentUser: User;
}

// Default dummy to avoid crash before init
const DEFAULT_USER: User = { id: '0', name: 'Guest', handle: '...', img: '' };

export const BillsContext = createContext<BillsContextType>({
  bills: [],
  addBill: () => {},
  users: [],
  currentUser: DEFAULT_USER,
});

export const useBills = () => useContext(BillsContext);
