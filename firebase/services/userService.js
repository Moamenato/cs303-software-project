import { db, collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc } from '../index';

/**
 * Get all users from the database
 * @returns {Promise<{success: boolean, users: Array, error: string}>}
 */
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, users: usersList };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, users: [], error: error.message };
  }
};

/**
 * Get a specific user by ID
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<{success: boolean, user: Object, error: string}>}
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    return { 
      success: true, 
      user: {
        id: userDoc.id,
        ...userDoc.data()
      } 
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a user's details
 * @param {string} userId - The ID of the user to update
 * @param {Object} userData - The user data to update
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a user's role
 * @param {string} userId - The ID of the user to update
 * @param {string} role - The new role for the user ('admin' or 'user')
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const updateUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a user
 * @param {string} userId - The ID of the user to delete
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};
