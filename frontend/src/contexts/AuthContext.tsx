import React, { createContext, useContext, useState, useEffect } from "react";
import api, { authLogin, authWipeAccount, LoginResponse } from "@/services/api";

interface AuthContextType {
  user: LoginResponse | null;
  login: (email?: string, password?: string) => Promise<void>;
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
    // Get or create device_id
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }

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
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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
