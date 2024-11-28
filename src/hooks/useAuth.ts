// src/hooks/useAuth.ts
import { UserType } from "../types";
import { useUser } from "./useUser";

export const useAuth = () => {
  const { user, addUser, removeUser } = useUser();

  const login = (user: UserType) => {
    addUser(user);
  };

  const logout = () => {
    removeUser();
  };

  return { user, login, logout };
};
