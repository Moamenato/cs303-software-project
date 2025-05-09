import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../config";

/**
 * Get all feedback for a specific item
 * @param {string} itemId - The item ID to get feedback for
 * @returns {Promise<{success: boolean, feedbacks: Array, error: string|null}>}
 */
export const getItemFeedbacks = async (itemId) => {
  try {
    if (!itemId) {
      return { success: false, error: "Item ID is required" };
    }

    const feedbackRef = collection(db, "feedbacks");
    const q = query(
      feedbackRef, 
      where("item", "==", itemId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    // Get basic feedback data
    const feedbacks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, feedbacks };
  } catch (error) {
    console.error("Error getting item feedbacks:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all feedback with user data populated for a specific item
 * @param {string} itemId - The item ID to get feedback for
 * @returns {Promise<{success: boolean, feedbacks: Array, error: string|null}>}
 */
export const getItemFeedbacksWithUserData = async (itemId) => {
  try {
    if (!itemId) {
      return { success: false, error: "Item ID is required" };
    }

    const feedbackRef = collection(db, "feedbacks");
    const q = query(feedbackRef, where("item", "==", itemId));
    const snapshot = await getDocs(q);

    // Get feedback data with user information
    const feedbacks = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const feedbackData = docSnap.data();
        const userDoc = await getDoc(doc(db, "users", feedbackData.user));
        const userData = userDoc.exists()
          ? userDoc.data()
          : { name: "Deleted User" };

        return {
          ...feedbackData,
          user: {
            id: feedbackData.user,
            ...userData
          },
          id: docSnap.id,
        };
      })
    );

    // Sort by creation date, newest first
    feedbacks.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return { success: true, feedbacks };
  } catch (error) {
    console.error("Error getting item feedbacks with user data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add feedback for an item
 * @param {object} feedbackData - The feedback data
 * @param {string} feedbackData.item - The item ID
 * @param {string} feedbackData.user - The user ID
 * @param {number} feedbackData.rating - The rating (1-5)
 * @param {string} feedbackData.comment - The comment text
 * @returns {Promise<{success: boolean, feedback: object|null, error: string|null}>}
 */
export const addFeedback = async (feedbackData) => {
  try {
    // Validate required fields
    if (!feedbackData.item || !feedbackData.user) {
      return { success: false, error: "Item ID and User ID are required" };
    }

    if (!feedbackData.rating || feedbackData.rating < 1 || feedbackData.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    if (!feedbackData.comment || feedbackData.comment.trim() === "") {
      return { success: false, error: "Comment is required" };
    }

    // Check if user has already left feedback for this item
    const existingFeedbackQuery = query(
      collection(db, "feedbacks"),
      where("item", "==", feedbackData.item),
      where("user", "==", feedbackData.user)
    );
    
    const existingFeedbackSnapshot = await getDocs(existingFeedbackQuery);
    
    if (!existingFeedbackSnapshot.empty) {
      return { success: false, error: "You have already reviewed this item" };
    }

    // Format the feedback with required fields
    const formattedFeedback = {
      item: feedbackData.item,
      user: feedbackData.user,
      rating: Number(feedbackData.rating),
      comment: feedbackData.comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "feedbacks"), formattedFeedback);

    return {
      success: true,
      feedback: {
        id: docRef.id,
        ...formattedFeedback,
      },
    };
  } catch (error) {
    console.error("Error adding feedback:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a feedback
 * @param {string} feedbackId - The feedback ID to update
 * @param {object} updateData - The data to update
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateFeedback = async (feedbackId, updateData) => {
  try {
    if (!feedbackId) {
      return { success: false, error: "Feedback ID is required" };
    }

    // Only allow updating rating and comment
    const allowedUpdates = {};
    
    if (updateData.rating && updateData.rating >= 1 && updateData.rating <= 5) {
      allowedUpdates.rating = Number(updateData.rating);
    }

    if (updateData.comment && updateData.comment.trim() !== "") {
      allowedUpdates.comment = updateData.comment.trim();
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return { success: false, error: "No valid fields to update" };
    }

    // Add update timestamp
    allowedUpdates.updatedAt = new Date().toISOString();

    await updateDoc(doc(db, "feedbacks", feedbackId), allowedUpdates);

    return { success: true };
  } catch (error) {
    console.error("Error updating feedback:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a feedback
 * @param {string} feedbackId - The feedback ID to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    if (!feedbackId) {
      return { success: false, error: "Feedback ID is required" };
    }

    await deleteDoc(doc(db, "feedbacks", feedbackId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return { success: false, error: error.message };
  }
};
