
const IMGBB_API_KEY = "b3f7ec97555422a3d01cf562ef0ad5ff";

const logNetworkError = (error, context) => {
  console.error(`Network error in ${context}:`, error);
  console.error(`Error name: ${error.name}`);
  console.error(`Error message: ${error.message}`);
  if (error.response) {
    console.error(`Response status: ${error.response.status}`);
    console.error(`Response headers:`, error.response.headers);
  }
  if (error.request) {
    console.error(`Request details:`, error.request);
  }
};


export const uploadProfileImage = async (imageFile, userId) => {
  console.log("Starting image upload with ImgBB service...");
  try {
    if (!imageFile || !imageFile.uri) {
      console.error("Invalid image file:", imageFile);
      return { success: false, url: null, error: "No valid image file provided" };
    }

    console.log("Image file URI:", imageFile.uri);
    
    const formData = new FormData();

    const filename = imageFile.uri.split('/').pop() || `profile_${userId}_${Date.now()}.jpg`;
    
    let type = 'image/jpeg';
    if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
    if (filename.toLowerCase().endsWith('.gif')) type = 'image/gif';
    
    console.log("Preparing file for upload:", { filename, type });
    
    formData.append("image", {
      uri: imageFile.uri,
      type: type,
      name: filename,
    });
    
    formData.append("key", IMGBB_API_KEY);

    console.log("FormData prepared, sending request to ImgBB API...");
    
    const uploadResponse = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });
    
    console.log("ImgBB API response status:", uploadResponse.status);

    const data = await uploadResponse.json();
    console.log("ImgBB API response data:", JSON.stringify(data));

    if (uploadResponse.ok && data.success) {
      const imageUrl = data.data.url;
      console.log("Image uploaded successfully to ImgBB:", imageUrl);
      return { success: true, url: imageUrl, error: null };
    } else {
      console.error("ImgBB upload failed:", data);
      return { success: false, url: null, error: data.error?.message || "ImgBB upload failed" };
    }
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    logNetworkError(error, 'uploadProfileImage');
    return { success: false, url: null, error: error.message };
  }
};

export const deleteProfileImage = async (imageUrl) => {
  console.warn("Image deletion not supported with ImgBB free service");
  return { success: true, error: null };
};
