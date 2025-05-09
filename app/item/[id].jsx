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
  Image,
  TextInput,
  Modal,
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
  getItemFeedbacksWithUserData,
  addFeedback,
} from "../../firebase/index";
import { useAuth } from "../../context/AuthContext";
import FeedbackReviews from "../../components/FeedbackReviews";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

export default function ItemPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item = params;
  const { currentUser, isAdmin } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [item]);

  const loadFeedback = async () => {
    try {
      setLoading(false);
      const result = await getItemFeedbacksWithUserData(item.id);

      if (result.success) {
        setFeedbacks(result.feedbacks);

        // Check if current user has already reviewed this item
        if (currentUser) {
          const hasReviewed = result.feedbacks.some(
            (feedback) => feedback.user.id === currentUser.id
          );
          setUserHasReviewed(hasReviewed);
        }
      } else {
        console.error("Error loading feedback:", result.error);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitFeedback = async () => {
    if (!currentUser) {
      Alert.alert(
        "Login Required",
        "You need to login to leave a review",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSubmittingFeedback(true);

      const feedbackData = {
        item: item.id,
        user: currentUser.id,
        rating: rating,
        comment: comment.trim()
      };

      const result = await addFeedback(feedbackData);

      if (result.success) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Review submitted!", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Your review has been submitted!");
        }

        // Reset form and close modal
        setComment('');
        setRating(5);
        setFeedbackModalVisible(false);

        // Reload feedbacks to include the new one
        loadFeedback();
      } else {
        Alert.alert("Error", result.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmittingFeedback(false);
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
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <Ionicons name="cube-outline" size={60} color="#ccc" />
              </View>
            )}
          </View>

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

              {!isAdmin && (
                <>
                  <View style={styles.quantityContainer}>
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
                </>
              )}
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
          <View style={styles.feedbackHeaderContainer}>
            <Text style={styles.feedbackHeader}>User Reviews:</Text>
            {currentUser && !userHasReviewed && !isAdmin && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setFeedbackModalVisible(true)}
              >
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <FeedbackReviews feedbacks={feedbacks} />
          )}
        </View>

        {/* Feedback Modal */}
        <Modal
          visible={feedbackModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFeedbackModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Write a Review</Text>

              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Rating:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={rating >= star ? "star" : "star-outline"}
                        size={30}
                        color={rating >= star ? "#FFD700" : "#aaa"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.commentLabel}>Your Review:</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Write your review here..."
                multiline
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setFeedbackModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    submittingFeedback && styles.disabledButton
                  ]}
                  onPress={handleSubmitFeedback}
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 0,
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
    color: "black",
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
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addToCartButton: {
    backgroundColor: "#F4CE14",
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
  feedbackHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addReviewButton: {
    backgroundColor: "#4A6FFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addReviewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 5,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4A6FFF',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
});
