// =====================================================================
// AI Insurance Policy — auth context + provider
//
// Stores the JWT in localStorage and exposes:
//   - user, loading
//   - login(email, password)
//   - signup(email, password, fullName)
//   - logout()
// =====================================================================
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getToken, setToken, type TokenResponse, type UserOut } from "./api";

interface AuthState {
  user: UserOut | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserOut>;
  signup: (email: string, password: string, fullName?: string) => Promise<UserOut>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<UserOut>("/api/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName?: string) => {
    const res = await api<TokenResponse>("/api/auth/signup", {
      method: "POST",
      body: { email, password, full_name: fullName ?? null },
      auth: false,
    });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}

// Alias for backwards-compat with older code that used `useAuth`
export const useAuth = useAuthContext;
