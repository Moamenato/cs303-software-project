import React, { createContext, useState, useContext, useEffect } from "react";
import { createUser, loginUser, logoutUser } from "../firebase/index";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const userData = { name, email, password };
      const result = await createUser(userData);

      if (result.success) {
        setCurrentUser(result.user);
      }

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await loginUser(email, password);

      if (result.success) {
        setCurrentUser(result.user);
      }

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const result = await logoutUser();
      setCurrentUser(null);
      return result;
    } catch (error) {
      console.error("Error logging out:", error);
      return false;
    }
  };

  const value = {
    currentUser,
    register,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
