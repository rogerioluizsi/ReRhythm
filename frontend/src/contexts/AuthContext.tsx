import React, { createContext, useContext, useState, useEffect } from "react";
import api, { authLogin, authRegister, authWipeAccount, LoginResponse } from "@/services/api";

interface AuthContextType {
  user: LoginResponse | null;
  login: (email?: string, password?: string) => Promise<void>;
  register: (email: string, password: string, repeatPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem("auth_token");
    const userId = localStorage.getItem("user_id");
    const isAnonymous = localStorage.getItem("is_anonymous") === "true";

    if (token && userId) {
      api.setAuthToken(token);
      setUser({
        token,
        user_id: parseInt(userId),
        is_anonymous: isAnonymous
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email?: string, password?: string) => {
    // For anonymous login: generate ephemeral device_id (not persisted)
    // For registered login: device_id not needed but sent for compatibility
    const deviceId = crypto.randomUUID();

    try {
      const response = await authLogin({
        device_id: deviceId,
        email,
        password
      });

      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user_id", response.user_id.toString());
      localStorage.setItem("is_anonymous", String(response.is_anonymous));
      
      api.setAuthToken(response.token);
      setUser(response);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, repeatPassword: string) => {
    // Generate ephemeral device_id for registration (not persisted)
    const deviceId = crypto.randomUUID();

    try {
      const response = await authRegister({
        device_id: deviceId,
        email,
        password,
        repeat_password: repeatPassword
      });

      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user_id", response.user_id.toString());
      localStorage.setItem("is_anonymous", String(response.is_anonymous));
      
      api.setAuthToken(response.token);
      setUser(response);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    // If user is anonymous, wipe their account data before logging out
    if (user?.is_anonymous && user?.user_id) {
      try {
        await authWipeAccount({ user_id: user.user_id });
      } catch (error) {
        console.error("Failed to wipe account data:", error);
      }
    }
    
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("is_anonymous");
    api.setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
