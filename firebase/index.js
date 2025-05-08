import { db } from "./config";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";

import {
  hashPassword,
  createUser,
  loginUser,
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  logoutUser,
} from "./services/authService";

import {
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} from "./services/cartService";

export {
  // Firebase config
  db,

  // Firestore methods
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  query,
  where,

  // Auth service
  hashPassword,
  createUser,
  loginUser,
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  logoutUser,

  // Cart service
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
};
