import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SHA256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";

export const hashPassword = (password) => {
  try {
    const salt = "auth-salt-2025";
    const hashedPassword = SHA256(password + salt).toString(Base64);
    console.log(hashedPassword);
    return hashedPassword;
  } catch (error) {
    console.warn(
      "Using fallback hash function. Please install crypto-js for secure hashing"
    );
  }
};

export const createUser = async (userData) => {
  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", userData.email)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, error: "User with this email already exists" };
    }

    const hashedPassword = hashPassword(userData.password);

    const userToSave = {
      email: userData.email,
      name: userData.name,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "users"), userToSave);

    const userForStorage = {
      id: docRef.id,
      email: userData.email,
      name: userData.name,
    };
    await saveUserToLocalStorage(userForStorage);

    return { success: true, user: userForStorage };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    const hashedPassword = hashPassword(password);
    if (userData.passwordHash !== hashedPassword) {
      return { success: false, error: "Invalid password" };
    }

    const userForStorage = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
    };

    await saveUserToLocalStorage(userForStorage);

    return { success: true, user: userForStorage };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: error.message };
  }
};

export const saveUserToLocalStorage = async (user) => {
  try {
    const userJson = JSON.stringify(user);
    await AsyncStorage.setItem("user", userJson);
  } catch (error) {
    console.error("Error saving to AsyncStorage:", error);
  }
};

export const getUserFromLocalStorage = async () => {
  try {
    const userJson = await AsyncStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Error getting user from AsyncStorage:", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem("user");
    return true;
  } catch (error) {
    console.error("Error logging out:", error);
    return false;
  }
};
