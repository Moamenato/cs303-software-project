import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
  Modal, TextInput, ActivityIndicator, StatusBar, Image, Pressable ,ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { db, collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where } from '../../firebase/index';

export default function CategoriesManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

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
        fetchProducts(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
      setProducts(productsList);
      return productsList;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch categories
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          productCount: 0 // Will be updated with actual count
        }));

      // Fetch category-item relationships
      const relationsCollection = collection(db, 'categoryItemRelations');
      const relationsSnapshot = await getDocs(relationsCollection);
      const relations = relationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update categories with product counts
      const categoriesWithCounts = categoriesList.map(category => {
        const relation = relations.find(r => r.category === category.id);
        const productCount = relation?.items?.length || 0;
        return {
          ...category,
          productCount,
          relationId: relation?.id || null,
          productIds: relation?.items || []
        };
      });

      setCategories(categoriesWithCounts);
      return categoriesWithCounts;
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
      return [];
    }
  };

  const viewCategoryDetails = (category) => {
    setSelectedCategory(category);

    // Find the products for this category
    const relatedProducts = products.filter(product =>
      category.productIds && category.productIds.includes(product.id)
    );
    setCategoryProducts(relatedProducts);
    setDetailsModalVisible(true);
  };

  const handleEditCategory = (category) => {
    setEditCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setModalVisible(true);
  };

  const handleAddCategory = () => {
    setEditCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
    });
    setModalVisible(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this category and all its products?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Get the category to find any relationships
              const category = categories.find(c => c.id === categoryId);
              
              // If there are items in this category, delete them all
              if (category?.productIds && category.productIds.length > 0) {
                // Delete all items in the category
                for (const itemId of category.productIds) {
                  try {
                    await deleteDoc(doc(db, 'items', itemId));
                    console.log(`Deleted item: ${itemId}`);
                  } catch (itemError) {
                    console.error(`Error deleting item ${itemId}:`, itemError);
                  }
                }
              }
              
              // Delete any category-item relation if it exists
              if (category?.relationId) {
                await deleteDoc(doc(db, 'categoryItemRelations', category.relationId));
              }
              
              // Permanently delete the category
              await deleteDoc(doc(db, 'categories', categoryId));
              
              Alert.alert('Success', 'Category and all its products have been permanently deleted');
              await loadData(); // Reload both categories and products data
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const saveCategory = async () => {
    try {
      // Validate form data
      if (!formData.name) {
        Alert.alert('Error', 'Category name is required');
        return;
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        updatedAt: new Date().toISOString(),
      };

      if (editCategory) {
        // Update existing category
        await setDoc(doc(db, 'categories', editCategory.id), categoryData, { merge: true });
        Alert.alert('Success', 'Category updated successfully');
      } else {
        // Add new category
        categoryData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'categories'), categoryData);
        Alert.alert('Success', 'Category added successfully');
      }

      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const renderCategoryItem = ({ item }) => (
    <Pressable
      style={styles.categoryItem}
      onPress={() => viewCategoryDetails(item)}
    >
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryIcon, { backgroundColor: getRandomColor(item.name) }]}>
          <Text style={styles.categoryInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.categoryDetails}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.productCount}>{item.productCount} products</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            handleEditCategory(item);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            handleDeleteCategory(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );

  // Helper function to generate consistent color based on name
  const getRandomColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA62B', '#A78BFA',
      '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#A3E635'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

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
        <Text style={styles.headerTitle}>Category Management</Text>
        <Pressable
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Ionicons name="add" size={24} color="#495E57" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#495E57" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.categoriesListContainer}
          data={categories.sort((a, b) => a.name?.localeCompare(b.name))} // Sort categories alphabetically
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No categories found</Text>
              <Pressable
                style={styles.addFirstButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.addFirstButtonText}>Add your first category</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Category Details Modal */}
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
                Category Details
              </Text>
              <Pressable
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            {selectedCategory && (
              <ScrollView style={styles.detailsModalBody}>
                <View style={styles.categoryDetailHeader}>
                  <View style={[styles.categoryIconLarge, { backgroundColor: getRandomColor(selectedCategory.name) }]}>
                    <Text style={styles.categoryInitialLarge}>{selectedCategory.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.categoryDetailInfo}>
                    <Text style={styles.categoryDetailName}>{selectedCategory.name}</Text>
                    <Text style={styles.categoryDetailDescription}>
                      {selectedCategory.description || 'No description'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Related Products ({categoryProducts.length})</Text>

                  {categoryProducts.length > 0 ? (
                    <View style={styles.relatedProductsList}>
                      {categoryProducts.map(product => (
                        <View key={product.id} style={styles.relatedProductItem}>
                          <View style={styles.relatedProductInfo}>

                            {product.imageUrl ? (
                              <Image 
                                source={{ uri: product.imageUrl }} 
                                style={styles.productImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.productImagePlaceholder}>
                                <Ionicons name="cube-outline" size={24} color="#ccc" />
                              </View>
                            )}

                            <View style={styles.relatedProductDetails}>
                              <Text style={styles.relatedProductTitle}>{product.title}</Text>
                              <Text style={styles.relatedProductPrice}>${product.price?.toFixed(2)}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyRelatedItems}>
                      <Ionicons name="cube-outline" size={48} color="#ccc" />
                      <Text style={styles.emptyRelatedText}>No products in this category</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Category Modal */}
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
                {editCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Category name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Category description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Pressable
                style={styles.saveButton}
                onPress={saveCategory}
              >
                <Text style={styles.saveButtonText}>Save Category</Text>
              </Pressable>
            </View>
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
  categoriesList: {
    padding: 16,
    marginBottom: 50,
  },
  categoriesListContainer: {
    marginBottom: 50,
  },
  categoryItem: {
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
  categoryInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryDetails: {
    marginLeft: 16,
    justifyContent: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
    color: '#495E57',
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
  viewButton: {
    backgroundColor: '#60A5FA', // Blue
  },
  editButton: {
    backgroundColor: '#495E57', // Green
  },
  deleteButton: {
    backgroundColor: '#EE4B2B', // Red
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
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
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
  },
  formGroup: {
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: '#495E57',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsModalBody: {
    padding: 16,
  },
  categoryDetailHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  categoryIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInitialLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryDetailInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  categoryDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryDetailDescription: {
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
  relatedProductsList: {
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
  },
  relatedProductItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  relatedProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F5F7F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#F5F7F8',
  },
  relatedProductDetails: {
    marginLeft: 12,
    flex: 1,
  },
  relatedProductTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#495E57',
  },
  emptyRelatedItems: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
  },
  emptyRelatedText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
