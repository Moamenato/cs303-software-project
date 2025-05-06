import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ItemCard({ item }) {
  const isInStock = item.stock > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text numberOfLines={2} style={styles.description}>
        {item.description}
      </Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text
        style={[styles.stock, isInStock ? styles.inStock : styles.outOfStock]}
      >
        {isInStock ? "In Stock" : "Out of Stock"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    color: "#555",
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    color: "#F4CE14",
    fontWeight: "bold",
    fontSize: 16,
  },
  stock: {
    marginTop: 4,
    fontWeight: "600",
  },
  inStock: {
    color: "#28a745",
  },
  outOfStock: {
    color: "#dc3545",
  },
});
