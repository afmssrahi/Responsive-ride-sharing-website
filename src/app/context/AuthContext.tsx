import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth as authApi, setTokens, clearTokens, getAccessToken } from "../services/api";

export type Role = "admin" | "user" | "driver";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error('Not initialized'); },
  logout: async () => {},
  setUser: () => {},
});

function mapRole(role: string): Role {
  if (role === 'ADMIN') return 'admin';
  if (role === 'DRIVER') return 'driver';
  return 'user';
}

function mapUser(raw: any): AuthUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: mapRole(raw.role),
    avatar: raw.avatar || raw.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
    status: raw.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authApi.me()
        .then(res => setUser(mapUser(res.data)))
        .catch(() => { clearTokens(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const res = await authApi.login(email, password);
    setTokens(res.data.accessToken, res.data.refreshToken);
    const mappedUser = mapUser(res.data.user);
    setUser(mappedUser);
    return mappedUser;
  }

  async function logout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Quick-access demo credentials (for the login page buttons)
export const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@swiftride.com.bd", password: "demo123", route: "/admin" },
  { label: "User", email: "farhan@example.com", password: "demo123", route: "/dashboard" },
  { label: "Driver", email: "rasel@example.com", password: "demo123", route: "/driver" },
];