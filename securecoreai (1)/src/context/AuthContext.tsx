import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthToken, registerLogoutCallback } from '../services/axios';
import { User, UserRole } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, role: UserRole, department: string) => Promise<boolean>;
  logout: (triggeredByAuthError?: boolean) => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const normalizeUser = (backendUser: any): User => {
    return {
      ...backendUser,
      role:
        backendUser.role === "super_admin"
          ? "Super Admin"
          : backendUser.role
            ?.split("_")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
      risk_score: backendUser.current_risk_score ?? 0,
      risk_level:
        backendUser.current_risk_level
          ? backendUser.current_risk_level.charAt(0).toUpperCase() +
          backendUser.current_risk_level.slice(1)
          : "Low",
      account_status: backendUser.is_locked ? "Locked" : "Active",
    };
  };

  // Define logout first so it can be referenced
  const logout = (triggeredByAuthError = false) => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    if (triggeredByAuthError) {
      toast.error('Session expired or unauthorized. Logging out...', { id: 'unauth-logout' });
    } else {
      toast.success('Successfully logged out.');
    }
  };

  // Register the 401 callback
  useEffect(() => {
    registerLogoutCallback(() => {
      logout(true);
    });
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get<User>('/privileged/me');
      setUser(normalizeUser(response.data));
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      // Let the 401 interceptor handle auth errors, but handle general ones
      if (err.response && err.response.status !== 401) {
        toast.error('Failed to retrieve security credentials.');
      }
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token } = response.data;

      setToken(access_token);
      setAuthToken(access_token);

      // Fetch user details immediately after setting the token
      // We pass the token manually or let axios run because default header is set
      const profileResponse = await api.get<User>('/privileged/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      setUser(normalizeUser(profileResponse.data));
      toast.success('Access Granted. Welcome back!');
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.response?.data?.detail || 'Authentication failed. Please verify your credentials.';
      toast.error(msg);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: UserRole,
    department: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const roleMap: Record<UserRole, string> = {
        Employee: "employee",
        Contractor: "contractor",
        Vendor: "vendor",
        Admin: "admin",
        Auditor: "auditor",
        "Super Admin": "super_admin",
      };

      await api.post('/auth/register', {
        username,
        email,
        password,
        role: roleMap[role],
        department,
      });


      // Auto-login newly registered operator
      const loginResponse = await api.post('/auth/login', { username, password });
      const { access_token } = loginResponse.data;

      setToken(access_token);
      setAuthToken(access_token);

      const profileResponse = await api.get<User>('/privileged/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      setUser(normalizeUser(profileResponse.data));
      toast.success('Registration successful! Operator terminal session established.');
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.response?.data?.detail || 'Registration failed. Try a different username or email.';
      toast.error(msg);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        register,
        logout,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
