import { createContext, useContext, useEffect, useState } from "react";
import { authService, type UsuarioPublico } from "@/frontend/services/auth.service";
import { storage } from "@/frontend/utils/storage";

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" && exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

interface AuthState {
  usuario: UsuarioPublico | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (nom_usuario: string, password: string) => Promise<void>;
  loginWithGoogle: (rol: "cliente" | "admin") => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, usuario: UsuarioPublico) => Promise<void>;
  setUsuario: (usuario: UsuarioPublico) => void;
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
          if (isTokenExpired(token)) {
            await storage.clear();
            setState((s) => ({ ...s, isLoading: false }));
          } else {
            setState({ usuario, token, isLoading: false, isAuthenticated: true });
          }
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

  const loginWithGoogle = async (rol: "cliente" | "admin") => {
    // Solo abre el browser — app/auth/callback.tsx procesa el token y llama setSession
    await authService.googleLogin(rol);
  };

  const logout = async () => {
    await storage.clear();
    setState({ usuario: null, token: null, isLoading: false, isAuthenticated: false });
  };

  const setUsuario = (usuario: UsuarioPublico) => {
    setState((s) => ({ ...s, usuario }));
    // Persistir en storage para que al reabrir la app se vea actualizado
    storage.setUser(usuario).catch(() => {});
  };

  return (
    <AuthContext.Provider       value={{ ...state, login, loginWithGoogle, logout, setSession, setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
