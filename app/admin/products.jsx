import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
  Modal, TextInput, Image, ActivityIndicator, StatusBar, ScrollView, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { db, collection, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc, query, where } from '../../firebase/index';
import { uploadProductImage } from '../../firebase/services/imgbbService';

export default function ProductsManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    stock: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Protect this route - only accessible to admins
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    loadData();
  }, [currentUser, isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          productCount: 0 // Will be updated if needed
        }));
      setCategories(categoriesList);
      return categoriesList;
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
      return [];
    }
  };
  
  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, 'items');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      
      // Get category-item relationships to augment products with category info
      const relationsCollection = collection(db, 'categoryItemRelations');
      const relationsSnapshot = await getDocs(relationsCollection);
      const relations = relationsSnapshot.docs.map(doc => doc.data());
      
      // Add category information to each product
      const productsWithCategories = productsList.map(product => {
        const productRelation = relations.find(relation => 
          relation.items && relation.items.includes(product.id)
        );
        return {
          ...product,
          categoryId: productRelation ? productRelation.category : null
        };
      });
      
      setProducts(productsWithCategories);
      return productsWithCategories;
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
      return [];
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      imageUrl: product.imageUrl || '',
      stock: product.stock ? product.stock.toString() : '',
      category: product.categoryId || '',
    });
    setImageFile(null);
    setSelectedCategoryId(product.categoryId || '');
    setModalVisible(true);
  };

  const handleAddProduct = () => {
    setEditProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      imageUrl: '',
      stock: '',
      category: '',
    });
    setImageFile(null);
    setSelectedCategoryId('');
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the product to find any category relationship
              const product = products.find(p => p.id === productId);
              
              // If product belongs to a category, update the category-item relation
              if (product?.categoryId) {
                // Find the relation document
                const relationQuery = query(
                  collection(db, 'categoryItemRelations'),
                  where('category', '==', product.categoryId)
                );
                const relationSnapshot = await getDocs(relationQuery);
                if (!relationSnapshot.empty) {
                  const relationDoc = relationSnapshot.docs[0];
                  const relation = relationDoc.data();
                  
                  // Remove the product from the items array
                  const updatedItems = relation.items.filter(id => id !== productId);
                  
                  // Update the relation document
                  await setDoc(doc(db, 'categoryItemRelations', relationDoc.id), 
                    { items: updatedItems, updatedAt: new Date().toISOString() }, 
                    { merge: true }
                  );
                }
              }
              
              // Permanently delete the product
              await deleteDoc(doc(db, 'items', productId));
              Alert.alert('Success', 'Product permanently deleted');
              fetchProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a product image');
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
        setImageFile(selectedAsset);
        
        Alert.alert(
          "Image Selected", 
          "Your image has been selected. Click 'Upload' to upload it to the server.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !imageFile.uri) {
      Alert.alert('Error', 'Please select an image first');
      return null;
    }
    
    try {
      setUploading(true);
      
      const uri = imageFile.uri;
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const fileType = uri.substring(uri.lastIndexOf('.') + 1);
      
      const imageFileObj = {
        uri: uri,
        name: filename,
        type: `image/${fileType}`,
      };
      
      // Upload the image using the imgbbService
      const productId = editProduct ? editProduct.id : null;
      const result = await uploadProductImage(imageFileObj, productId);
      
      if (result.success) {
        // Set the imageUrl in the form data
        setFormData({
          ...formData,
          imageUrl: result.url
        });
        
        Alert.alert(
          "Upload Success", 
          "Image has been uploaded successfully."
        );
        
        return result.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveProduct = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a product title');
      return;
    }

    // Validate price is a positive number
    const price = Number(formData.price);
    if (!formData.price.trim() || isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Validate stock is a positive integer
    const stock = parseInt(formData.stock || '0', 10);
    if (isNaN(stock) || stock < 0 || String(stock) !== String(parseInt(formData.stock || '0', 10))) {
      Alert.alert('Error', 'Stock must be a positive integer value');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);

    try {
      // Upload image if a new one was selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else if (!formData.imageUrl) {
          // If upload failed and there's no existing URL, show error
          setLoading(false);
          return;
        }
      }

      // Prepare the product data
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        imageUrl: imageUrl,
        stock: parseInt(formData.stock || '0', 10),
        updatedAt: new Date().toISOString(),
      };

      if (editProduct) {
        // Update existing product
        const productRef = doc(db, 'items', editProduct.id);
        await setDoc(productRef, productData, { merge: true });

        // Update or create category relation if category changed
        if (selectedCategoryId !== editProduct.categoryId) {
          // If the product was previously in a category, remove it
          if (editProduct.categoryId) {
            const prevRelationRef = doc(db, 'categoryItemRelations', editProduct.categoryId);
            const prevRelationSnapshot = await getDoc(prevRelationRef);
            
            if (prevRelationSnapshot.exists()) {
              const prevRelation = prevRelationSnapshot.data();
              const updatedItems = prevRelation.items.filter(id => id !== editProduct.id);
              
              await setDoc(prevRelationRef, { 
                ...prevRelation,
                items: updatedItems 
              });
            }
          }

          // Add to new category
          const newRelationRef = doc(db, 'categoryItemRelations', selectedCategoryId);
          const newRelationSnapshot = await getDoc(newRelationRef);
          
          if (newRelationSnapshot.exists()) {
            const newRelation = newRelationSnapshot.data();
            const items = newRelation.items || [];
            if (!items.includes(editProduct.id)) {
              await setDoc(newRelationRef, { 
                ...newRelation,
                items: [...items, editProduct.id] 
              });
            }
          } else {
            // Create new relation if it doesn't exist
            await setDoc(newRelationRef, {
              category: selectedCategoryId,
              items: [editProduct.id]
            });
          }
        }

        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Create new product
        const newProductRef = await addDoc(collection(db, 'items'), {
          ...productData,
          createdAt: new Date().toISOString(),
        });

        // Add to category relation
        const relationRef = doc(db, 'categoryItemRelations', selectedCategoryId);
        const relationSnapshot = await getDoc(relationRef);
        
        if (relationSnapshot.exists()) {
          const relation = relationSnapshot.data();
          const items = relation.items || [];
          await setDoc(relationRef, { 
            ...relation,
            items: [...items, newProductRef.id] 
          });
        } else {
          // Create new relation if it doesn't exist
          await setDoc(relationRef, {
            category: selectedCategoryId,
            items: [newProductRef.id]
          });
        }

        Alert.alert('Success', 'Product created successfully');
      }

      // Close modal and refresh data
      setModalVisible(false);
      fetchProducts();

    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setDetailsModalVisible(true);
  };

  const renderProductItem = ({ item }) => (
    <Pressable 
      style={styles.productItem}
      onPress={() => viewProductDetails(item)}
    >
      <View style={styles.productInfo}>
        <Image 
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} 
          style={styles.productImage} 
        />
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productPrice}>${item.price?.toFixed(2)}</Text>
          <Text style={styles.productStock}>Stock: {item.stock || 0}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <Pressable 
          style={[styles.actionButton, styles.editButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            handleEditProduct(item);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#fff" />
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            handleDeleteProduct(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );

  if (!isAdmin) {
    return null; // Don't render anything if not admin (while redirecting)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.push('/admin')}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Product Management</Text>
        <Pressable 
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={24} color="#495E57" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#495E57" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products.filter(p => !p.deleted).sort((a, b) => a.title?.localeCompare(b.title))} // Filter deleted products and sort alphabetically
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <Pressable 
                style={styles.addFirstButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.addFirstButtonText}>Add your first product</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Product Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Product Details
              </Text>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {selectedProduct && (
              <ScrollView style={styles.detailsModalBody}>
                <View style={styles.productDetailHeader}>
                  <Image 
                    source={{ uri: selectedProduct.imageUrl || 'https://via.placeholder.com/200' }}
                    style={styles.productImageLarge}
                    resizeMode="cover"
                  />
                  <View style={styles.productDetailInfo}>
                    <Text style={styles.productDetailName}>{selectedProduct.title}</Text>
                    <Text style={styles.productDetailPrice}>${selectedProduct.price?.toFixed(2)}</Text>
                    <Text style={styles.productDetailStock}>Stock: {selectedProduct.stock || 0}</Text>
                    <Text style={styles.productDetailCategory}>
                      Category: {selectedProduct.categoryId ? 
                        categories.find(cat => cat.id === selectedProduct.categoryId)?.name || 'Unknown' : 
                        'None'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.productDetailDescription}>
                      {selectedProduct.description || 'No description provided'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({...formData, title: text})}
                  placeholder="Product title"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Product description"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <Pressable
                  style={styles.categorySelector}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={styles.categorySelectorText}>
                    {selectedCategoryId ? 
                      categories.find(cat => cat.id === selectedCategoryId)?.name || 'Select category' :
                      'Select category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color="#666" 
                  />
                </Pressable>
                
                {showCategoryDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.categoryDropdown} nestedScrollEnabled={true}>

                      {categories.map(category => (
                        <Pressable
                          key={category.id}
                          style={[
                            styles.categoryOption,
                            selectedCategoryId === category.id && styles.selectedCategoryOption
                          ]}
                          onPress={() => {
                            setSelectedCategoryId(category.id);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={styles.categoryOptionText}>{category.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Price*</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => {
                      setFormData({...formData, price: text});
                    }}
                    placeholder="Enter price"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stock}
                    onChangeText={(text) => {
                      setFormData({...formData, stock: text});
                    }}
                    placeholder="Enter stock quantity"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Image</Text>
                <View style={styles.imageUploadContainer}>
                  {(imageFile || formData.imageUrl) && (
                    <Image
                      source={{ uri: imageFile ? imageFile.uri : formData.imageUrl }}
                      style={styles.imagePreview}
                    />
                  )}
                  <View style={styles.imageButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.imagePickerButton} 
                      onPress={pickImage}
                      disabled={uploading}
                    >
                      <Ionicons name="image-outline" size={22} color="#fff" />
                      <Text style={styles.imageButtonText}>Select Image</Text>
                    </TouchableOpacity>
                    
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.saveButton}
                onPress={saveProduct}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    marginBottom: 55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDEFEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    overflow: 'hidden', // For the ripple effect
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productDetails: {
    marginLeft: 16,
    justifyContent: 'center',
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#495E57',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#495E57',
  },
  deleteButton: {
    backgroundColor: '#EE4B2B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
  },
  addFirstButton: {
    backgroundColor: '#495E57',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 40,
    marginBottom: 5,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    marginBottom: 55,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryDropdown: {
    maxHeight: 200,
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedCategoryOption: {
    backgroundColor: '#e6f0ed',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#495E57',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageUploadContainer: {
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imagePickerButton: {
    backgroundColor: '#495E57',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  imageUploadButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailsModalBody: {
    padding: 16,
  },
  productDetailHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  productImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  productDetailInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDetailPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495E57',
    marginBottom: 8,
  },
  productDetailStock: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  productDetailCategory: {
    fontSize: 16,
    color: '#666',
  },
  productDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  detailsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionContainer: {
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
    padding: 16,
  },
});
