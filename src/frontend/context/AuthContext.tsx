import { createContext, useContext, useEffect, useState } from "react";
import { authService, type UsuarioPublico } from "@/frontend/services/auth.service";
import { storage } from "@/frontend/utils/storage";

interface AuthState {
  usuario: UsuarioPublico | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (nom_usuario: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, usuario: UsuarioPublico) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Recuperar sesion guardada al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getToken();
        const usuario = await storage.getUser<UsuarioPublico>();

        if (token && usuario) {
          setState({ usuario, token, isLoading: false, isAuthenticated: true });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const setSession = async (token: string, usuario: UsuarioPublico) => {
    await storage.setToken(token);
    await storage.setUser(usuario);
    setState({ usuario, token, isLoading: false, isAuthenticated: true });
  };

  const login = async (nom_usuario: string, password: string) => {
    const { token, usuario } = await authService.login(nom_usuario, password);
    await setSession(token, usuario);
  };

  const logout = async () => {
    await storage.clear();
    setState({ usuario: null, token: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
