"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

interface User {
  id: number;
  email: string;
  nome: string;
  role: string;
  tenantId: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userBase64Info?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for token on mount
    const token = localStorage.getItem("@Financeiro:token");
    if (token) {
      // In a real scenario, you parse the JWT payload here or hit a /me endpoint
      // For now, we simulate being logged in if the token exists
      setIsAuthenticated(true);
      // Example of setting mock user from local storage token
      // setUser(jwtDecode(token));
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userBase64Info?: string) => {
    localStorage.setItem("@Financeiro:token", token);
    setIsAuthenticated(true);
    
    // Simulating user info extraction
    if (userBase64Info) {
      try {
        const decoded = JSON.parse(atob(userBase64Info));
        setUser(decoded);
      } catch (e) {
        console.error("Failed to parse user info");
      }
    }
    
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("@Financeiro:token");
    setIsAuthenticated(false);
    setUser(null);
    // Explicitly navigate to login
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
