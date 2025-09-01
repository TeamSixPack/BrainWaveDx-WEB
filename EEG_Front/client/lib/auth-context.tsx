import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  id?: string; // 백엔드 호환성을 위해 id도 지원
  name: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 컴포넌트 마운트 시 로컬 스토리지에서 로그인 상태 확인
  useEffect(() => {
    const storedUser = localStorage.getItem('neuroscan_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
        localStorage.removeItem('neuroscan_user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('neuroscan_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neuroscan_user');
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
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