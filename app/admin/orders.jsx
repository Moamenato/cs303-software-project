import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Alert,
  Modal, ActivityIndicator, StatusBar, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus, 
  deleteOrder 
} from '../../firebase/services/orderService';
import { db, collection, getDocs, doc, getDoc } from '../../firebase/index';

export default function OrdersManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [products, setProducts] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Protect this route - only accessible to admins
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    fetchOrders();
    fetchProducts();
  }, [currentUser, isAdmin, router]);
  
  // Fetch all products to have them ready for order item lookup
  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, 'items');
      const productsSnapshot = await getDocs(productsCollection);
      const productsMap = {};
      
      productsSnapshot.docs.forEach(doc => {
        productsMap[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });
      
      setProducts(productsMap);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await getAllOrders();
      
      if (result.success) {
        setOrders(result.orders);
      } else {
        Alert.alert('Error', result.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails(null); // Reset details while loading
    setModalVisible(true);
    setEditMode(false);
    
    try {
      // Fetch the most up-to-date order details
      const result = await getOrderById(order.id);
      
      if (result.success) {
        // If we have user information in the order, use it directly
        setOrderDetails(result.order);
      } else {
        // If detailed fetch fails, use the order data we already have
        setOrderDetails(order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrderDetails(order); // Use basic order data if detailed fetch fails
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const result = await updateOrderStatus(orderId, status);
      
      if (result.success) {
        // Update local state
        const updatedAt = new Date().toISOString();
        
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status, updatedAt }
            : order
        ));
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status, updatedAt });
          setOrderDetails({ ...orderDetails, status, updatedAt });
        }
        
        Alert.alert('Success', `Order status updated to ${status}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA62B'; // Orange
      case 'shipped':
        return '#A78BFA'; // Purple
      case 'cancelled':
        return '#F87171'; // Red
      default:
        return '#9CA3AF'; // Gray
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return `$${(Number(amount) / 100).toFixed(2)}`;
  };

  const handleDeleteOrder = async (orderId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteOrder(orderId);
              
              if (result.success) {
                setOrders(orders.filter(order => order.id !== orderId));
                Alert.alert('Success', 'Order deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete order');
              }
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'Failed to delete order');
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItemContainer}>
      <Pressable 
        style={({pressed}) => [
          styles.orderItem,
          pressed && styles.orderItemPressed
        ]}
        onPress={() => viewOrderDetails(item)}
      >
        <View style={{flex: 1}}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
            <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
            </View>
          </View>
          
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{formatCurrency(item.totalAmount)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.items ? `${item.items.length} item${item.items.length !== 1 ? 's' : ''}` : 'No items'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent's onPress
              setSelectedOrder(item);
              setOrderDetails(item);
              setEditMode(true);
              setModalVisible(true);
            }}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
          </Pressable>
          
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the parent's onPress
              handleDeleteOrder(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Orders Management</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#495E57" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Order' : 'Order Details'}</Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setEditMode(false);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {!orderDetails ? (
                <ActivityIndicator style={styles.detailsLoading} size="large" color="#0056A2" />
              ) : (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Information</Text>
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order ID:</Text>
                        <Text style={styles.detailValue}>{orderDetails.id}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(orderDetails.createdAt)}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <View style={[
                          styles.statusTag, 
                          { backgroundColor: getStatusColor(orderDetails.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {orderDetails.status || 'Pending'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Amount:</Text>
                        <Text style={styles.detailValue}>{formatCurrency(orderDetails.totalAmount)}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {orderDetails.user && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Customer Information</Text>
                      <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Name:</Text>
                          <Text style={styles.detailValue}>{orderDetails.user.displayName || orderDetails.user.name}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Email:</Text>
                          <Text style={styles.detailValue}>{orderDetails.user.email}</Text>
                        </View>
                        
                        {orderDetails.user.phone && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phone:</Text>
                            <Text style={styles.detailValue}>{orderDetails.user.phone}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {orderDetails.shippingAddress && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Shipping Address</Text>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.addressText}>{orderDetails.shippingAddress}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    <View style={styles.itemsContainer}>
                      {orderDetails.items && orderDetails.items.length > 0 ? (
                        orderDetails.items.map((item, index) => (
                          <View key={index} style={styles.orderItemRow}>
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>
                                {item.itemId && products[item.itemId] ? 
                                  products[item.itemId].title : 
                                  (item.title || 'Unknown Product')}
                              </Text>
                              <Text style={styles.itemQuantity}>Quantity: {item.quantity || 1}</Text>
                              {item.itemId && (
                                <Text style={styles.itemId}>ID: {item.itemId.slice(0, 8)}...</Text>
                              )}
                            </View>
                            <Text style={styles.itemPrice}>
                              {formatCurrency(item.price || 0)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noItemsText}>No items in this order</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Update Status</Text>
                    <View style={styles.statusButtons}>
                      <Pressable 
                        style={[
                          styles.statusButton, 
                          { backgroundColor: getStatusColor('pending') },
                          orderDetails.status === 'Pending' && styles.activeStatusButton
                        ]}
                        onPress={() => handleUpdateOrderStatus(orderDetails.id, 'Pending')}
                      >
                        <Text style={styles.statusButtonText}>Pending</Text>
                      </Pressable>
                      <Pressable 
                        style={[
                          styles.statusButton, 
                          { backgroundColor: getStatusColor('shipped') },
                          orderDetails.status === 'Shipped' && styles.activeStatusButton
                        ]}
                        onPress={() => handleUpdateOrderStatus(orderDetails.id, 'Shipped')}
                      >
                        <Text style={styles.statusButtonText}>Shipped</Text>
                      </Pressable>
                      <Pressable 
                        style={[
                          styles.statusButton, 
                          { backgroundColor: getStatusColor('cancelled') },
                          orderDetails.status === 'Cancelled' && styles.activeStatusButton
                        ]}
                        onPress={() => handleUpdateOrderStatus(orderDetails.id, 'Cancelled')}
                      >
                        <Text style={styles.statusButtonText}>Cancelled</Text>
                      </Pressable>
                    </View>
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
    marginBottom: 55, // Add bottom margin for navigation tabs
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  orderItemContainer: {
    marginBottom: 16,
    width: '100%',
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    overflow: 'hidden', // For the ripple effect on Android
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // This centers items vertically
  },
  orderItemPressed: {
    backgroundColor: '#F5F7F8',
    opacity: 0.9,
  },
  actionButtonsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    overflow: 'hidden', // For the ripple effect on Android
  },
  editButton: {
    backgroundColor: '#495E57',
  },
  deleteButton: {
    backgroundColor: '#EE4B2B',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 180,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  modalBody: {
    padding: 16,
  },
  detailsLoading: {
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  itemsContainer: {
    backgroundColor: '#F5F7F8',
    borderRadius: 8,
    padding: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemId: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    color: '#495E57',
    fontWeight: 'bold',
  },
  noItemsText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: '30%',
    alignItems: 'center',
  },
  activeStatusButton: {
    borderWidth: 2,
    borderColor: '#333',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
