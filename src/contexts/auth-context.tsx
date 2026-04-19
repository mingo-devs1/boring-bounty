'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { User, UserRole } from '@/lib/supabase';
import { supabase, supabaseAdmin } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user: privyUser } = usePrivy();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    const fetchUser = async () => {
      if (authenticated && privyUser?.wallet?.address) {
        const walletAddress = privyUser.wallet.address;
        console.log('Fetching user for wallet:', walletAddress);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        console.log('User fetch result:', { data, error });

        if (data) {
          setUser(data);
        } else if (error?.code === 'PGRST116') {
          // User doesn't exist yet, will be created on profile completion
          console.log('User not found in database, redirecting to profile completion');
          setUser(null);
        } else {
          // Error occurred, don't set user to null - keep previous state or handle gracefully
          console.error('Error fetching user:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [ready, authenticated, privyUser]);

  const login = async () => {
    await privyLogin();
  };

  const logout = async () => {
    await privyLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (privyUser?.wallet?.address) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', privyUser.wallet.address)
        .single();
      console.log('Refresh user result:', data);
      setUser(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: authenticated && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
