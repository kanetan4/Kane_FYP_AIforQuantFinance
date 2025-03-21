import  { createContext, useContext } from "react";
import { User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
