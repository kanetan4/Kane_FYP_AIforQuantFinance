// src/hooks/useUser.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { UserType } from "../types";

export const useUser = () => {
  const { user, setUser } = useContext(AuthContext);

  const addUser = (user: UserType) => {
    setUser(user);
  };

  const removeUser = () => {
    setUser(null);
  };

  return { user, addUser, removeUser };
};
