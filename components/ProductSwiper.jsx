import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from "react-native";

export default function ProductSwiper({ products }) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const productsPerView = width < 768 ? 1 : width < 1024 ? 2 : 4;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? products.length - productsPerView : prev - productsPerView
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + productsPerView) % products.length);
  };

  const addToCart = (product) => {
    Alert.alert("Add to Cart", `${product.title} added to cart!`);
  };

  const visibleProducts = products
    .slice(currentIndex, currentIndex + productsPerView)
    .concat(
      products.slice(
        0,
        Math.max(0, currentIndex + productsPerView - products.length)
      )
    );

  const cardWidth =
    width < 768 ? width - 48 : width < 1024 ? width / 2.5 : width / 4.5;

  return (
    <View style={styles.wrapper}>
      {products.length > 0 ? (
        <View style={styles.swiperContainer}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <FlatList
            data={visibleProducts}
            horizontal
            keyExtractor={(item, index) => `${item._id}-${index}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.card, { width: cardWidth }]}>
                <Image
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_BASEURL}/images/item/${item._id}`,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.title}>
                    {item.title.length > 15
                      ? item.title.substring(0, 15) + "..."
                      : item.title}
                  </Text>
                  <Text style={styles.tags}>{item.tags.join(", ")}</Text>
                  <Text style={styles.price}>${item.price}</Text>
                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.cartButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noProducts}>No products available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F5F7F8",
    padding: 16,
    borderRadius: 10,
  },
  swiperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#495E57",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  navButtonText: {
    color: "#F4CE14",
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 8,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#495E57",
  },
  tags: {
    color: "#45474B",
    fontSize: 13,
    marginTop: 4,
  },
  price: {
    marginTop: 6,
    fontSize: 16,
    color: "#45474B",
    fontWeight: "600",
  },
  cartButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: "#F4CE14",
    alignItems: "center",
  },
  cartButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noProducts: {
    textAlign: "center",
    color: "#495E57",
    fontSize: 16,
  },
});
