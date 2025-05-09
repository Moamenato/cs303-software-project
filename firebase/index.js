import { db, storage } from "./config";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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
  setUserRole,
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
  clearUserCart,
} from "./services/cartService";

import {
  getItemFeedbacks,
  getItemFeedbacksWithUserData,
  addFeedback,
  updateFeedback,
  deleteFeedback
} from "./services/feedbackService";

export {
  db,
  storage,

  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,

  hashPassword,
  createUser,
  loginUser,
  saveUserToLocalStorage,
  getUserFromLocalStorage,
  updateUserProfile,
  setUserRole,
  
  uploadProfileImage,
  deleteProfileImage,
  logoutUser,
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearUserCart,
  
  getItemFeedbacks,
  getItemFeedbacksWithUserData,
  addFeedback,
  updateFeedback,
  deleteFeedback,
};
