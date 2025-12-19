
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import SplitBill from './pages/SplitBill';
import SplitWith from './pages/SplitWith';
import BillDetails from './pages/BillDetails';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Activity from './pages/Activity';
import ScanReceipt from './pages/ScanReceipt';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DbSetup from './pages/DbSetup';
import BottomNav from './components/BottomNav';

import { Bill, User } from './types';
import { ThemeContext, BillsContext, AuthContext } from './contexts';
import { fetchBills, createBillInDb, fetchUsers } from './services/db';
import { supabase } from './services/supabase';
import { getCurrentUserProfile, signOut as authSignOut } from './services/auth';

const AppContent: React.FC = () => {
  const location = useLocation();
  // Paths where the bottom nav should be hidden
  const hideNavPaths = ['/', '/split-with', '/split-bill', '/scan', '/login', '/signup', '/setup'];
  const shouldShowNav = !hideNavPaths.includes(location.pathname) && !location.pathname.startsWith('/bill-details') && !location.pathname.startsWith('/group-details');

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col text-slate-900 dark:text-white transition-colors duration-300">
      <div className="flex-1">
        <Routes>
          {/* 
            Public Routes: 
            - Only accessible if NOT logged in.
            - If logged in, these redirect to /dashboard.
          */}
          <Route path="/" element={<PublicRoute><Onboarding /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          <Route path="/setup" element={<DbSetup />} />

          {/* 
            Protected Routes:
            - Only accessible if logged in.
            - If NOT logged in, these redirect to /login.
          */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/group-details/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><ScanReceipt /></ProtectedRoute>} />
          <Route path="/split-with" element={<ProtectedRoute><SplitWith /></ProtectedRoute>} />
          <Route path="/split-bill" element={<ProtectedRoute><SplitBill /></ProtectedRoute>} />
          <Route path="/bill-details/:id" element={<ProtectedRoute><BillDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Catch all - Redirect to Root (Onboarding) which will then redirect to Dashboard if auth */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {shouldShowNav && <BottomNav />}
    </div>
  );
};

// Guard for routes that should ONLY be seen by unauthenticated users (Onboarding, Login, Signup)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { session, loading } = React.useContext(AuthContext);
  
  if (loading) return null; 

  // If user is already logged in, send them straight to Dashboard.
  // This handles the "Returning User" case.
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guard for routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { session, loading } = React.useContext(AuthContext);
  
  if (loading) return null;
  
  if (!session) {
    // Redirect to Login if trying to access protected route without auth.
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Database Error State
  const [dbSetupRequired, setDbSetupRequired] = useState(false);

  // 1. Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // 2. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile();
      else setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile();
      } else {
        setCurrentUser(null);
        setBills([]);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setCurrentUser(profile as User);
        // Only load app data if we have a user
        loadAppData();
      }
    } catch (e: any) {
      if (e.message === 'DB_SETUP_REQUIRED') {
          setDbSetupRequired(true);
      }
      console.error("Profile load error", e);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAppData = async () => {
      try {
          const usersData = await fetchUsers();
          setUsers(usersData);
          const billsData = await fetchBills();
          setBills(billsData);
      } catch (e) {
          console.error("Data load error", e);
      }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const addBill = async (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
    try {
        await createBillInDb(newBill);
        const updatedBills = await fetchBills();
        setBills(updatedBills);
    } catch (e) {
        console.error("Failed to save bill", e);
    }
  };
  
  const handleSignOut = async () => {
      await authSignOut();
      setSession(null);
      setCurrentUser(null);
  };

  if (authLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-background-dark text-white">
              <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  // Fallback user to prevent crashes if context is accessed before ready
  const safeCurrentUser = currentUser || { id: 'guest', name: 'Guest', handle: '', img: '' };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <AuthContext.Provider value={{ session, user: currentUser, loading: authLoading, signOut: handleSignOut }}>
        <BillsContext.Provider value={{ bills, addBill, users, currentUser: safeCurrentUser }}>
            <BrowserRouter>
               {dbSetupRequired ? <DbSetup /> : <AppContent />}
            </BrowserRouter>
        </BillsContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
