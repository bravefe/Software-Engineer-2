import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  logout as logoutFromServer,
} from "../api/auth";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "REVIEWER";
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasUserAction = useRef(false);

  useEffect(() => {
    if (initialUser !== undefined) {
      return;
    }

    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active && !hasUserAction.current) {
          setUser(currentUser);
        }
      })
      .catch((cause: unknown) => {
        if (active && !hasUserAction.current) {
          setAuthError(
            cause instanceof Error
              ? cause.message
              : "Unable to restore authentication session",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [initialUser]);

  const login = (newUser: UserProfile) => {
    hasUserAction.current = true;
    setUser(newUser);
    setAuthError(null);
  };

  const logout = async () => {
    hasUserAction.current = true;
    setAuthError(null);
    try {
      await logoutFromServer();
      setUser(null);
    } catch (cause: unknown) {
      const message =
        cause instanceof Error ? cause.message : "Unable to sign out";
      setAuthError(message);
      throw cause;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
