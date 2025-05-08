import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../config";

export const getUserCart = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const cartsRef = collection(db, "carts");
    const q = query(cartsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        cart: {
          items: [],
          userId,
        },
      };
    }

    const cartDoc = querySnapshot.docs[0];
    const cartData = cartDoc.data();

    return {
      success: true,
      cart: {
        ...cartData,
        id: cartDoc.id,
      },
    };
  } catch (error) {
    console.error("Error getting user cart:", error);
    return { success: false, error: error.message };
  }
};

export const addToCart = async (userId, itemId, quantity = 1) => {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const { success, cart, error } = await getUserCart(userId);

    if (!success) {
      return { success: false, error };
    }

    let items = [];
    let itemExists = false;

    if (cart.items && Array.isArray(cart.items)) {
      items = [...cart.items];

      for (let i = 0; i < items.length; i++) {
        if (items[i].itemId === itemId) {
          items[i].quantity += quantity;
          itemExists = true;
          break;
        }
      }
    }

    if (!itemExists) {
      items.push({
        itemId,
        quantity,
      });
    }

    if (cart.id) {
      await setDoc(
        doc(db, "carts", cart.id),
        {
          items,
          userId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { success: true, cart: { ...cart, items } };
    } else {
      const newCart = {
        userId,
        items,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "carts"), newCart);

      return {
        success: true,
        cart: {
          ...newCart,
          id: docRef.id,
        },
      };
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, error: error.message };
  }
};

export const updateCartItemQuantity = async (userId, itemId, quantity) => {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    if (quantity <= 0) {
      return removeCartItem(userId, itemId);
    }

    const { success, cart, error } = await getUserCart(userId);

    if (!success) {
      return { success: false, error };
    }

    if (!cart.id) {
      return { success: false, error: "Cart not found" };
    }

    let items = [];
    let itemFound = false;

    if (cart.items && Array.isArray(cart.items)) {
      items = [...cart.items];
      for (let i = 0; i < items.length; i++) {
        if (items[i].itemId === itemId) {
          items[i].quantity = quantity;
          itemFound = true;
          break;
        }
      }
    }

    if (!itemFound) {
      return { success: false, error: "Item not found in cart" };
    }

    await setDoc(
      doc(db, "carts", cart.id),
      {
        items,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, cart: { ...cart, items } };
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return { success: false, error: error.message };
  }
};

export const removeCartItem = async (userId, itemId) => {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }
    const { success, cart, error } = await getUserCart(userId);

    if (!success) {
      return { success: false, error };
    }

    if (!cart.id) {
      return { success: false, error: "Cart not found" };
    }

    let items = [];

    if (cart.items && Array.isArray(cart.items)) {
      items = cart.items.filter((item) => item.itemId !== itemId);
    }

    await setDoc(
      doc(db, "carts", cart.id),
      {
        items,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, cart: { ...cart, items } };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return { success: false, error: error.message };
  }
};
