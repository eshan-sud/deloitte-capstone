import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { springApi } from "../services/springApi";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "eventnest_auth_token";

function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setStoredToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const savedToken = getStoredToken();

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await springApi.getCurrentUser(savedToken);
      setToken(savedToken);
      setUser(response.user);
    } catch {
      clearStoredToken();
      setToken("");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const response = await springApi.login(credentials);
    setToken(response.token);
    setUser(response.user);
    setStoredToken(response.token);
    return response.user;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await springApi.register(payload);
    setToken(response.token);
    setUser(response.user);
    setStoredToken(response.token);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken("");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    const response = await springApi.getCurrentUser(token);
    setUser(response.user);
    return response.user;
  }, [token]);

  const updateProfile = useCallback(
    async (updates) => {
      if (!token) {
        throw new Error("Authentication required.");
      }

      const response = await springApi.updateProfile(token, updates);
      setUser(response.user);
      return response.user;
    },
    [token],
  );

  const value = useMemo(() => {
    const role = user?.role || "GUEST";

    return {
      token,
      user,
      role,
      isLoading,
      isAuthenticated: Boolean(user && token),
      isAdmin: role === "ADMIN",
      isOrganizer: role === "ORGANIZER",
      isCustomer: role === "CUSTOMER",
      canManageEvents: role === "ADMIN" || role === "ORGANIZER",
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    };
  }, [
    isLoading,
    login,
    logout,
    refreshUser,
    register,
    token,
    updateProfile,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
