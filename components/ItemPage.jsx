import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import {
  doc,
  db,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "../firebase/index";
import FeedbackReviews from "./FeedbackReviews";

export default function ItemPage() {
  const { item } = useRoute().params;
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
        {item.tags?.map((tag, index) => (
          <Text key={index} style={styles.tag}>
            • {tag}
          </Text>
        ))}
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
  feedbackItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  feedbackUser: {
    fontWeight: "bold",
    color: "#222",
  },
  feedbackDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  feedbackRating: {
    color: "#F4CE14",
    fontWeight: "600",
  },
  feedbackComment: {
    fontSize: 14,
    color: "#444",
  },
  noFeedback: {
    color: "#999",
    fontStyle: "italic",
  },
});
