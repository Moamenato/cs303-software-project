import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { db, collection, getDocs, query, where } from '../../firebase/index';

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);

  // Protect this route - only accessible to admins
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/home');
    }
  }, [currentUser, isAdmin, router]);

  // Fetch real data from Firestore database
  useEffect(() => {
    if (isAdmin) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch users count
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          setActiveUsers(usersSnapshot.docs.length);
          
          // Fetch products count
          const productsQuery = query(collection(db, 'items'));
          const productsSnapshot = await getDocs(productsQuery);
          setTotalProducts(productsSnapshot.docs.length);
          
          // Fetch orders count
          const ordersQuery = query(collection(db, 'orders'));
          const ordersSnapshot = await getDocs(ordersQuery);
          setTotalOrders(ordersSnapshot.docs.length);
          
          // Fetch categories count
          const categoriesQuery = query(collection(db, 'categories'));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          setTotalCategories(categoriesSnapshot.docs.length);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          // Set fallback values in case of error
          setActiveUsers(0);
          setTotalProducts(0);
          setTotalOrders(0);
          setTotalCategories(0);
          Alert.alert('Error', 'Failed to load dashboard data. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isAdmin]);

  const menuItems = [
    { 
      id: 'products', 
      title: 'Products', 
      icon: 'cube-outline',
      count: totalProducts,
      route: '/admin/products'
    },
    { 
      id: 'categories', 
      title: 'Categories', 
      icon: 'grid-outline',
      count: totalCategories,
      route: '/admin/categories'
    },
    { 
      id: 'orders', 
      title: 'Orders', 
      icon: 'cart-outline',
      count: totalOrders,
      route: '/admin/orders'
    },
    { 
      id: 'users', 
      title: 'Users', 
      icon: 'people-outline',
      count: activeUsers,
      route: '/admin/users'
    },
  ];

  const navigateTo = (route) => {
    router.push(route);
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin (while redirecting)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/home')}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Admin Menu */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#495E57" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.menuContainer}>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => navigateTo(item.route)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={32} color="#495E57" />
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemCount}>{item.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: '#666',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: '#495E57',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#EDEFEE',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 24,
    color: '#495E57',
    fontWeight: 'bold',
  },
});
