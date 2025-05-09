import React from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ItemCard({ item }) {
  const isInStock = item.stock > 0;
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  
  // Adjust image size based on screen width
  const imageSize = isSmallScreen ? 70 : 100;

  return (
    <View style={styles.card}>
      <View style={[styles.cardContent, isSmallScreen && styles.smallScreenContent]}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[
                styles.productImage, 
                { width: imageSize, height: imageSize }
              ]}
              resizeMode="contain"
            />
          ) : (
            <View style={[
              styles.productImage, 
              styles.imagePlaceholder, 
              { width: imageSize, height: imageSize }
            ]}>
              <Ionicons name="cube-outline" size={isSmallScreen ? 24 : 30} color="#ccc" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
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
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  smallScreenContent: {
    flexDirection: 'column',
    alignItems: 'center',
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
