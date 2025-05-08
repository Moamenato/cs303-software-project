import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  getUserCart,
  updateCartItemQuantity,
  removeCartItem,
  db,
  doc,
  getDoc,
} from "../firebase/index";
import { StatusBar } from "expo-status-bar";

const CartComponent = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    loadCartData();
  }, [currentUser]);

  const loadCartData = async () => {
    try {
      setLoading(true);

      if (!currentUser) {
        setCart(null);
        setCartItems([]);
        setTotalPrice(0);
        setLoading(false);
        return;
      }

      const { success, cart, error } = await getUserCart(currentUser.id);

      if (!success) {
        console.error("Error loading cart:", error);
        setLoading(false);
        return;
      }

      setCart(cart);

      if (cart.items && cart.items.length > 0) {
        const detailedItems = await Promise.all(
          cart.items.map(async (cartItem) => {
            try {
              const itemDoc = await getDoc(doc(db, "items", cartItem.itemId));

              if (itemDoc.exists()) {
                const itemData = itemDoc.data();
                return {
                  ...cartItem,
                  itemData: {
                    ...itemData,
                    id: cartItem.itemId,
                  },
                };
              } else {
                return {
                  ...cartItem,
                  itemData: { title: "Product Unavailable", price: 0 },
                };
              }
            } catch (err) {
              console.error("Error fetching item details:", err);
              return {
                ...cartItem,
                itemData: { title: "Error Loading Product", price: 0 },
              };
            }
          })
        );

        setCartItems(detailedItems);

        const total = detailedItems.reduce((sum, item) => {
          return sum + item.itemData.price * item.quantity;
        }, 0);

        setTotalPrice(total);
      } else {
        setCartItems([]);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Error in loadCartData:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (!currentUser) return;

    try {
      setUpdating(true);

      const result = await updateCartItemQuantity(
        currentUser.id,
        itemId,
        newQuantity
      );

      if (result.success) {
        await loadCartData();
      } else {
        Alert.alert("Error", result.error || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!currentUser) return;

    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(true);

              const result = await removeCartItem(currentUser.id, itemId);

              if (result.success) {
                await loadCartData();
              } else {
                Alert.alert("Error", result.error || "Failed to remove item");
              }
            } catch (error) {
              console.error("Error removing item:", error);
              Alert.alert("Error", "An unexpected error occurred");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity
        onPress={() => router.push(`/item/${item.itemId}`)}
        style={styles.itemInfo}
      >
        {item.itemData.imageURL ? (
          <Image
            source={{ uri: item.itemData.imageURL }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={24} color="#ccc" />
          </View>
        )}

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.itemData.title}
          </Text>
          <Text style={styles.itemPrice}>
            ${item.itemData.price ? item.itemData.price.toFixed(2) : "0.00"}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
          disabled={updating}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
          disabled={updating}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.itemId)}
        disabled={updating}
      >
        <Ionicons name="trash-outline" size={24} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyCart}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartText}>Your cart is empty</Text>

    </View>
  );

  const renderNotLoggedIn = () => (
    <View style={styles.emptyCart}>
      <Ionicons name="person-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartText}>Please log in to view your cart</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push("/auth/login")}
      >
        <Text style={styles.shopButtonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6FFF" />
        </View>
      );
    }

    if (!currentUser) {
      return renderNotLoggedIn();
    }

    if (cartItems.length === 0) {
      return renderEmptyCart();
    }

    return (
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>My Cart</Text>

        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.itemId}
          contentContainerStyle={styles.cartList}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cartContainer: {
    flex: 1,
    padding: 16,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 16,
  },
  cartList: {
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: "#4A6FFF",
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  quantityButton: {
    backgroundColor: "#f0f0f0",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A6FFF",
  },
  checkoutButton: {
    backgroundColor: "#4A6FFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 70,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#666",
    marginTop: 12,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#4A6FFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CartComponent;
