/**
 * Script to upload item images from a directory to ImgBB and update Firebase items
 * 
 * Usage: node upload-item-images.js
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Firebase configuration (matches your existing config)
const firebaseConfig = {
  apiKey: "AIzaSyCAKMADiPYZr8QS1ua0BQR_rrz7ZSLQ_TM",
  authDomain: "epichardware-d1a40.firebaseapp.com",
  projectId: "epichardware-d1a40",
  storageBucket: "epichardware-d1a40.appspot.com",
  messagingSenderId: "288909581545",
  appId: "1:288909581545:web:2df0aecf386dbf56832478",
  measurementId: "G-Y4TLDZF9GC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ImgBB API key
const IMGBB_API_KEY = "b3f7ec97555422a3d01cf562ef0ad5ff";

// Directory containing the images
const IMAGES_DIR = path.resolve(__dirname, '..', 'firebase', 'item');

/**
 * Upload an image to ImgBB
 * @param {string} imagePath - Path to the image file
 * @param {string} itemId - Item ID
 * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
 */
async function uploadImage(imagePath, itemId) {
  try {
    console.log(`Uploading image for item ${itemId}...`);
    
    // Read the file
    const imageBuffer = fs.readFileSync(imagePath);
    const filename = path.basename(imagePath);
    
    // Determine file type
    let type = 'image/jpeg';
    if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
    if (filename.toLowerCase().endsWith('.gif')) type = 'image/gif';
    
    // Create form data
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename,
      contentType: type,
    });
    formData.append('key', IMGBB_API_KEY);
    
    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`Successfully uploaded image for item ${itemId}`);
      return { success: true, url: data.data.url, error: null };
    } else {
      console.error(`ImgBB upload failed for item ${itemId}:`, data);
      return { success: false, url: null, error: data.error?.message || 'ImgBB upload failed' };
    }
  } catch (error) {
    console.error(`Error uploading image for item ${itemId}:`, error);
    return { success: false, url: null, error: error.message };
  }
}

/**
 * Update an item document in Firestore with the image URL
 * @param {string} itemId - Item ID
 * @param {string} imageUrl - Image URL
 * @returns {Promise<boolean>}
 */
async function updateItemWithImageUrl(itemId, imageUrl) {
  try {
    console.log(`Updating item ${itemId} with image URL ${imageUrl}`);
    await updateDoc(doc(db, 'items', itemId), {
      imageUrl: imageUrl,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`Error updating item ${itemId}:`, error);
    return false;
  }
}

/**
 * Main function to process all images
 */
async function processImages() {
  try {
    // Check if directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`Directory not found: ${IMAGES_DIR}`);
      return;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`Found ${files.length} files in ${IMAGES_DIR}`);
    
    // Process each file
    for (const file of files) {
      // Skip non-image files
      if (!file.match(/\.(jpg|jpeg|png|gif)$/i)) {
        console.log(`Skipping non-image file: ${file}`);
        continue;
      }
      
      // Extract item ID from filename (removing extension)
      const itemId = path.parse(file).name;
      const imagePath = path.join(IMAGES_DIR, file);
      
      console.log(`Processing file ${file} for item ${itemId}`);
      
      // Upload the image
      const uploadResult = await uploadImage(imagePath, itemId);
      
      if (uploadResult.success) {
        // Update the item with the image URL
        const updateResult = await updateItemWithImageUrl(itemId, uploadResult.url);
        
        if (updateResult) {
          console.log(`✅ Successfully processed item ${itemId}`);
        } else {
          console.error(`❌ Failed to update item ${itemId} in Firebase`);
        }
      } else {
        console.error(`❌ Failed to upload image for item ${itemId}: ${uploadResult.error}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ All images processed successfully');
  } catch (error) {
    console.error('❌ Error processing images:', error);
  }
}

// Run the script
processImages().then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Script failed:', error);
});
