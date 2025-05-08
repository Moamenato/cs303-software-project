import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { uploadProfileImage } from "../../firebase/index";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

const ProfileComponent = () => {
  const { currentUser, logout, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height
  });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    photoURL: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setWindowDimensions({
        width: window.width,
        height: window.height
      });
    };

    const dimensionsListener = Dimensions.addEventListener("change", updateDimensions);

    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        photoURL: currentUser.photoURL || "",
      });
    }

    return () => {
      dimensionsListener.remove();
    };
  }, [currentUser]);

  const handleChange = (name, value) => {
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setSelectedImage(selectedAsset);
        
        Alert.alert(
          "Image Selected", 
          "Your image has been selected. Save your profile to upload it.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };
  
  const uploadImage = async () => {
    if (!selectedImage || !currentUser?.id) return null;
    
    try {
      setIsUploading(true);
      
      const uri = selectedImage.uri;
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const fileType = uri.substring(uri.lastIndexOf('.') + 1);
      
      const imageFile = {
        uri: uri,
        name: filename,
        type: `image/${fileType}`,
      };
      
      const uploadResult = await uploadProfileImage(imageFile, currentUser.id);
      
      if (uploadResult.success) {
        setProfileData(prev => ({
          ...prev,
          photoURL: uploadResult.url
        }));
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Error", error.message || "Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      let dataToUpdate = {...profileData};
      
      if (selectedImage) {
        const photoURL = await uploadImage();
        if (photoURL) {
          dataToUpdate.photoURL = photoURL;
        }
      }
      
      const result = await updateProfile(dataToUpdate);

      if (result.success) {
        setIsEditing(false);
        setSelectedImage(null);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Profile update error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
      while (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
      </SafeAreaView>
    );
  }

  const isSmallScreen = windowDimensions.width < 768;
  const isPortrait = windowDimensions.height > windowDimensions.width;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F5F7F8" 
        translucent={false}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[
          styles.container, 
          isSmallScreen ? styles.containerSmall : styles.containerLarge
        ]}>
          <View style={[
            styles.header,
            isSmallScreen && isPortrait ? styles.headerPortrait : styles.headerLandscape
          ]}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={() => isEditing && pickImage()}>
                {currentUser.photoURL ? (
                  <Image
                    source={{ uri: currentUser.photoURL }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <FontAwesome name="user" size={50} color="#ffffff" />
                    {isEditing && <Text style={styles.editPhotoText}>Edit</Text>}
                  </View>
                )}
                {isEditing && currentUser.photoURL && (
                  <View style={styles.editPhotoBadge}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profileData.name}</Text>
              <Text style={styles.userEmail}>{profileData.email}</Text>
            </View>
            
            {!isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={24} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {isEditing ? (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={profileData.name}
                    onChangeText={(text) => handleChange("name", text)}
                    placeholder="Enter your full name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={profileData.email}
                    onChangeText={(text) => handleChange("email", text)}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    editable={false}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={profileData.phone}
                    onChangeText={(text) => handleChange("phone", text)}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={profileData.address}
                    onChangeText={(text) => handleChange("address", text)}
                    placeholder="Enter your address"
                    multiline
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Profile Picture</Text>
                  <View style={styles.imagePickerContainer}>
                    {selectedImage ? (
                      <View style={styles.previewContainer}>
                        <Image 
                          source={{ uri: selectedImage.uri }} 
                          style={styles.imagePreview} 
                        />
                        <TouchableOpacity 
                          style={styles.changeImageButton}
                          onPress={pickImage}
                        >
                          <Text style={styles.changeImageText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.imagePicker} 
                        onPress={pickImage}
                      >
                        <MaterialIcons name="add-photo-alternate" size={24} color="#495E57" />
                        <Text style={styles.imagePickerText}>Select Profile Image</Text>
                      </TouchableOpacity>
                    )}
                    {isUploading && (
                      <View style={styles.uploadingIndicator}>
                        <ActivityIndicator size="small" color="#495E57" />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={24} color="#333" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>{profileData.name}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={24} color="#333" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profileData.email}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={24} color="#333" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>
                      {profileData.phone || "No phone number added"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={24} color="#333" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>
                      {profileData.address || "No address added"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7F8", 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  containerSmall: {
    width: '100%',
  },
  containerLarge: {
    width: '80%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  header: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerPortrait: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  headerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  profileImageContainer: {
    marginRight: 20,
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#495E57", 
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  editPhotoBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F4CE14", 
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: "#F4CE14", 
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 5,
  },
  infoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#495E57", 
    paddingBottom: 10,
    color: "#495E57", 
  },
  infoContainer: {
    gap: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#45474B", 
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 2,
  },
  formContainer: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    minWidth: "48%",
  },
  imagePickerContainer: {
    marginTop: 10,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 5,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    color: "#495E57", 
    marginTop: 8,
  },
  previewContainer: {
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginVertical: 10,
  },
  changeImageButton: {
    backgroundColor: "#F4CE14", 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 5,
  },
  changeImageText: {
    color: "#fff",
    fontWeight: "500",
  },
  uploadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  uploadingText: {
    marginLeft: 8,
    color: "#45474B", 
  },
  saveButton: {
    backgroundColor: "#F4CE14",
  },
  cancelButton: {
    backgroundColor: "#45474B", 
  },
  logoutButton: {
    backgroundColor: "red", 
    width: "100%",
    marginBottom: 45,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  actionsSection: {
    marginBottom: 30,
  },
});

export default ProfileComponent;