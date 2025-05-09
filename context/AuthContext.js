import React, { createContext, useState, useContext, useEffect } from "react";
import { createUser, loginUser, logoutUser, updateUserProfile, getUserFromLocalStorage, setUserRole } from "../firebase/index";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getUserFromLocalStorage();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
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

  const updateProfile = async (profileData) => {
    try {
      if (!currentUser) {
        return { success: false, error: "No user is logged in" };
      }
      
      setLoading(true);
      const result = await updateUserProfile(currentUser.id, profileData);
      
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

  const isAdmin = currentUser?.role === 'admin';

  const updateRole = async (userId, role) => {
    try {
      if (!currentUser || !isAdmin) {
        return { success: false, error: "Not authorized to change roles" };
      }
      
      const result = await setUserRole(userId, role);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
    updateRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
