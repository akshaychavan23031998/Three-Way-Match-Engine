'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';

interface AuthContextValue {
  token: string | null;
  ready: boolean;
  login: (token: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    queryClient.clear();
    if (pathname !== '/login') router.replace('/login');
  }, [pathname, queryClient, router]);

  useEffect(() => {
    const stored = authStorage.get();
    setToken(stored);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (!token && pathname !== '/login') router.replace('/login');
    if (token && pathname === '/login') router.replace('/dashboard');
  }, [pathname, ready, router, token]);
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(undefined);
  }, [logout]);

  const login = (value: string): void => {
    authStorage.set(value);
    setToken(value);
  };

  return (
    <AuthContext.Provider value={{ token, ready, login, logout }}>
      {ready ? children : <div className="grid min-h-screen place-items-center">Loading…</div>}
    </AuthContext.Provider>
  );
}

export const useAuthContext = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuthContext must be used within AuthProvider');
  return value;
};
