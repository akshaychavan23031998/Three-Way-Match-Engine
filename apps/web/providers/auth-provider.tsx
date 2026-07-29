'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authStorage } from '@/lib/auth-storage';

interface AuthContextValue {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const stored = authStorage.get();
    setToken(stored);
    setReady(true);
    if (!stored && pathname !== '/login') router.replace('/login');
  }, [pathname, router]);
  const login = (value: string): void => {
    authStorage.set(value);
    setToken(value);
  };
  const logout = (): void => {
    authStorage.clear();
    setToken(null);
    router.push('/login');
  };
  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {ready ? children : null}
    </AuthContext.Provider>
  );
}
export const useAuthContext = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuthContext must be used within AuthProvider');
  return value;
};
