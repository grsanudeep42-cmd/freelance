import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

type AuthState = {
  // Starter state: no persistence yet.
  isAuthenticated: boolean;
  displayName?: string;
};

type AuthAction =
  | { type: "LOGIN"; displayName: string }
  | { type: "LOGOUT" };

const AuthContext = createContext<{
  state: AuthState;
  login: (displayName: string) => void;
  logout: () => void;
} | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return { isAuthenticated: true, displayName: action.displayName };
    case "LOGOUT":
      return { isAuthenticated: false, displayName: undefined };
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, { isAuthenticated: false });

  const value = useMemo(
    () => ({
      state,
      login: (displayName: string) => dispatch({ type: "LOGIN", displayName }),
      logout: () => dispatch({ type: "LOGOUT" })
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): {
  state: AuthState;
  login: (displayName: string) => void;
  logout: () => void;
} {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

