import { db, storage } from "./config";

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
  updateUserProfile,
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  logoutUser,
} from "./services/authService";

import {
  uploadProfileImage,
  deleteProfileImage
} from "./services/imgbbService";

import {
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} from "./services/cartService";

export {
  db,
  storage,

  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  query,
  where,

  hashPassword,
  createUser,
  loginUser,
  updateUserProfile,
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  
  uploadProfileImage,
  deleteProfileImage,
  logoutUser,
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
};
