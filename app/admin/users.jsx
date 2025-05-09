import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Alert,
  Modal, TextInput, ActivityIndicator, StatusBar, Switch, Image, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  updateUserRole, 
  deleteUser 
} from '../../firebase/services/userService';

export default function UsersManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photoURL: ''
  });

  // Protect this route - only accessible to admins
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/home');
      return;
    }
    fetchUsers();
  }, [currentUser, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      
      if (result.success) {
        setUsers(result.users);
      } else {
        Alert.alert('Error', result.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setIsUserAdmin(user.role === 'admin');
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      photoURL: user.photoURL || ''
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId, e) => {
    // Stop propagation if event is passed (clicked from button in card)
    if (e) e.stopPropagation();
    
    // Don't allow deleting yourself
    if (userId === currentUser.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteUser(userId);
              
              if (result.success) {
                Alert.alert('Success', 'User permanently deleted');
                fetchUsers();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete user');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const saveUser = async () => {
    try {
      if (!selectedUser) return;
      
      const role = isUserAdmin ? 'admin' : 'user';
      
      // First update role
      const roleResult = await updateUserRole(selectedUser.id, role);
      
      if (!roleResult.success) {
        Alert.alert('Error', roleResult.error || 'Failed to update user role');
        return;
      }
      
      // Then update other user details
      const userData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        photoURL: formData.photoURL
      };
      
      const userResult = await updateUser(selectedUser.id, userData);
      
      if (userResult.success) {
        Alert.alert('Success', 'User updated successfully');
        setModalVisible(false);
        fetchUsers();
      } else {
        Alert.alert('Error', userResult.error || 'Failed to update user details');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#FF6B6B'; // Red for admin
      case 'user':
      default:
        return '#4ECDC4'; // Teal for regular users
    }
  };

  const renderUserItem = ({ item }) => {
    return (
      <Pressable 
        style={({pressed}) => [
          styles.userItem,
          pressed && styles.userItemPressed
        ]}
        onPress={() => viewUserDetails(item)}
      >
        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: item.photoURL ? 'transparent' : getRoleColor(item.role) }]}>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.userInitial}>{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'Unnamed User'}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.phone && <Text style={styles.userExtra}>Phone: {item.phone}</Text>}
            <View style={[styles.roleTag, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>{item.role || 'user'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Pressable 
            style={[styles.actionButton, styles.editButton]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent's onPress
              viewUserDetails(item);
            }}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </Pressable>
          {item.id !== currentUser.id && (
            <Pressable 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => handleDeleteUser(item.id, e)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin (while redirecting)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.push('/admin')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Users Management</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#495E57" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.usersList}
        />
      )}

      {/* Edit User Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              {selectedUser && (
                <>
                  <View style={styles.userSummary}>
                    {selectedUser.photoURL ? (
                      <Image source={{ uri: selectedUser.photoURL }} style={styles.modalAvatar} />
                    ) : (
                      <View style={[styles.modalAvatarPlaceholder, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                        <Text style={styles.modalAvatarText}>{selectedUser.name?.charAt(0).toUpperCase() || 'U'}</Text>
                      </View>
                    )}
                    <Text style={styles.summaryEmail}>{selectedUser.email}</Text>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.name}
                      onChangeText={(text) => setFormData({...formData, name: text})}
                      placeholder="User's name"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({...formData, phone: text})}
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Address</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.address}
                      onChangeText={(text) => setFormData({...formData, address: text})}
                      placeholder="Address"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Profile Photo URL</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.photoURL}
                      onChangeText={(text) => setFormData({...formData, photoURL: text})}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </View>
                  
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>User Role</Text>
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Admin Access</Text>
                      <Switch
                        value={isUserAdmin}
                        onValueChange={setIsUserAdmin}
                        trackColor={{ false: '#E0E0E0', true: '#A3E635' }}
                        thumbColor={isUserAdmin ? '#495E57' : '#fff'}
                      />
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <Pressable
                      style={[styles.footerButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.footerButton, styles.saveButton]}
                      onPress={saveUser}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </>
              )}
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
  usersList: {
    padding: 16,
    
  },
  userItem: {
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
    overflow: 'hidden', // For ripple effect
  },
  userItemPressed: {
    backgroundColor: '#F5F7F8',
    opacity: 0.9,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 16,
    justifyContent: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userExtra: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userSummary: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryEmail: {
    fontSize: 16,
    color: '#666',
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 30,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F7F8',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#495E57',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
