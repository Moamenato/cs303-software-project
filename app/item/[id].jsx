import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  db,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addToCart,
} from "../../firebase/index";
import { useAuth } from "../../context/AuthContext";
import FeedbackReviews from "../../components/FeedbackReviews";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function ItemPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item = params;
  const { currentUser } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const feedbackRef = collection(db, "feedbacks");
        const q = query(feedbackRef, where("item", "==", item.id));
        const snapshot = await getDocs(q);

        const data = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const feedbackData = docSnap.data();
            const userDoc = await getDoc(doc(db, "users", feedbackData.user));
            const userData = userDoc.exists()
              ? userDoc.data()
              : { name: "Unknown" };

            return {
              ...feedbackData,
              user: userData,
              id: docSnap.id,
            };
          })
        );

        setFeedbacks(data);
      } catch (error) {
        console.error("Error loading feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [item]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      Alert.alert(
        "Login Required",
        "You need to login to add items to your cart",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    if (item.stock <= 0) {
      Alert.alert("Out of Stock", "This item is currently out of stock");
      return;
    }

    try {
      setAddingToCart(true);
      const result = await addToCart(currentUser.id, item.id, quantity);

      if (result.success) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart!", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Item added to cart!");
        }
      } else {
        Alert.alert("Error", result.error || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (quantity < item.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#495E57" />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.price}>Price: ${item.price}</Text>
          <Text
            style={[
              styles.stock,
              item.stock > 0 ? styles.inStock : styles.outOfStock,
            ]}
          >
            {item.stock > 0 ? `In Stock (${item.stock})` : "Out of Stock"}
          </Text>

          {item.stock > 0 && (
            <View style={styles.cartSection}>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  onPress={decreaseQuantity}
                  style={styles.quantityButton}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{quantity}</Text>

                <TouchableOpacity
                  onPress={increaseQuantity}
                  style={styles.quantityButton}
                  disabled={quantity >= item.stock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.tagHeader}>Tags:</Text>
          {item.tags && typeof item.tags === "string" ? (
            item.tags.split(",").map((tag, index) => (
              <Text key={index} style={styles.tag}>
                • {tag.trim()}
              </Text>
            ))
          ) : Array.isArray(item.tags) && item.tags.length > 0 ? (
            item.tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>
                • {tag}
              </Text>
            ))
          ) : (
            <Text style={styles.tag}>No tags available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.feedbackHeader}>User Reviews:</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <FeedbackReviews feedbacks={feedbacks} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 20,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  section: {
    marginBottom: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
    color: "#555",
  },
  price: {
    fontSize: 18,
    color: "#F4CE14",
    fontWeight: "bold",
    marginBottom: 8,
  },
  stock: {
    fontSize: 16,
    marginBottom: 12,
  },
  inStock: {
    color: "#28a745",
  },
  outOfStock: {
    color: "#dc3545",
  },
  cartSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityButton: {
    backgroundColor: "#f0f0f0",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 16,
    width: 30,
    textAlign: "center",
  },
  addToCartButton: {
    backgroundColor: "#4A6FFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tagHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#495E57",
  },
  tag: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  feedbackHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
});
