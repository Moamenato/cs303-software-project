import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../index";

// Get all orders
export const getAllOrders = async () => {
  try {
    const ordersRef = collection(db, "orders");
    const ordersSnapshot = await getDocs(ordersRef);
    const ordersList = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort orders by date (newest first)
    ordersList.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return { success: true, orders: ordersList };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: error.message };
  }
};

// Get orders by user ID
export const getUserOrders = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return { success: false, error: error.message };
  }
};

// Get a specific order by ID
export const getOrderById = async (orderId) => {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" };
    }

    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      return { success: false, error: "Order not found" };
    }
    
    return { 
      success: true, 
      order: {
        id: orderDoc.id,
        ...orderDoc.data()
      }
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { success: false, error: error.message };
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    if (!orderData.userId || !orderData.items || !orderData.totalAmount) {
      return { success: false, error: "Missing required order information" };
    }
    
    // Format the order with required fields
    const formattedOrder = {
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: orderData.status || "Pending",
      createdAt: new Date().toISOString(),
      ...orderData // Include any other fields provided
    };
    
    const docRef = await addDoc(collection(db, "orders"), formattedOrder);
    
    return { 
      success: true, 
      orderId: docRef.id,
      order: {
        id: docRef.id,
        ...formattedOrder
      }
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" };
    }
    
    if (!status) {
      return { success: false, error: "Status is required" };
    }
    
    await setDoc(doc(db, "orders", orderId), { 
      status,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { 
      success: true, 
      message: `Order status updated to ${status}` 
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message };
  }
};

// Delete an order
export const deleteOrder = async (orderId) => {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" };
    }
    
    await deleteDoc(doc(db, "orders", orderId));
    
    return { 
      success: true, 
      message: "Order deleted successfully" 
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: error.message };
  }
};

// Get recent orders (for dashboard)
export const getRecentOrders = async (limitCount = 5) => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return { success: false, error: error.message };
  }
};
