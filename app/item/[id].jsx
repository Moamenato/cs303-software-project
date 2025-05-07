import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
} from "../../firebaseConfig";
import FeedbackReviews from "../../components/FeedbackReviews";
import { Ionicons } from "@expo/vector-icons";

export default function ItemPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item = params;

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.tagHeader}>Tags:</Text>
        {Array.isArray(item.tags) && item.tags.length > 0 ? (
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
  );
}

const styles = StyleSheet.create({
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
