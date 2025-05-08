import { storage } from "../config";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

/**
 * Upload an image file to Firebase Storage
 * @param {File} imageFile - The image file to upload
 * @param {string} userId - The user ID to use in the file path
 * @returns {Promise<{success: boolean, url: string, error: string|null}>} Result object
 */
export const uploadProfileImage = async (imageFile, userId) => {
  try {
    if (!imageFile || !imageFile.uri) {
      return { success: false, url: null, error: "No valid image file provided" };
    }

    const uri = imageFile.uri;
    const fileExtension = uri.split('.').pop();
    const timestamp = new Date().getTime();
    const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `profile-images/${fileName}`);
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const snapshot = await uploadBytes(storageRef, blob);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL, error: null };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return { success: false, url: null, error: error.message };
  }
};

export const deleteProfileImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return { success: false, error: "No image URL provided" };
    }
    
    const storageRef = ref(storage, imageUrl);
    
    await deleteObject(storageRef);
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return { success: false, error: error.message };
  }
};
