import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Vibration,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../firebase/index";

const PaginationDots = ({ totalDots, currentIndex, onDotPress }) => {
  const maxVisibleDots = 10;
  let startDot = 0;

  if (currentIndex >= maxVisibleDots - 1) {
    startDot = currentIndex - maxVisibleDots + 2;
    if (startDot + maxVisibleDots > totalDots) {
      startDot = totalDots - maxVisibleDots;
    }
  }

  const endDot = Math.min(startDot + maxVisibleDots, totalDots);

  return (
    <View style={styles.dotContainer}>
      {Array.from({ length: endDot - startDot }).map((_, i) => {
        const dotIndex = startDot + i;
        return (
          <TouchableOpacity
            key={dotIndex}
            onPress={() => onDotPress(dotIndex)}
            style={[styles.dot, currentIndex === dotIndex && styles.activeDot]}
          />
        );
      })}
    </View>
  );
};

export default function ProductSwiper({ products }) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { currentUser, isAdmin } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [topProducts, setTopProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());

      const randomProducts = shuffled.slice(0, 10);

      setTopProducts(randomProducts);
    } else {
      setTopProducts([]);
    }
  }, [products]);

  const calculateProductsPerView = () => {
    if (width < 360) return 1;
    if (width < 600) return 1.5;
    if (width < 900) return 2;
    return 3;
  };

  const calculateCardDimensions = () => {
    const productsPerView = calculateProductsPerView();
    const cardMargin = width < 360 ? 4 : 8;
    const horizontalPadding = width < 360 ? 8 : 16;
    const cardWidth =
      (width - horizontalPadding * 2 - cardMargin * 2 * productsPerView) /
      productsPerView;

    return {
      cardWidth,
      cardMargin,
      imageHeight: width < 360 ? 120 : width < 600 ? 160 : 180,
      titleSize: width < 360 ? 12 : width < 600 ? 14 : 16,
      priceSize: width < 360 ? 12 : width < 600 ? 14 : 16,
      buttonPadding: width < 360 ? 4 : width < 600 ? 6 : 8,
      buttonTextSize: width < 360 ? 10 : width < 600 ? 12 : 14,
    };
  };

  const dimensions = calculateCardDimensions();

  const scrollToIndex = (index) => {
    if (flatListRef.current && topProducts.length > 0) {
      setCurrentIndex(index);
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(
      contentOffset / (dimensions.cardWidth + dimensions.cardMargin * 2)
    );
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const handleAddToCart = async (product) => {
    // Vibrate on button press
    Vibration.vibrate(50);

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

    if (product.stock <= 0) {
      // Vibrate with pattern for error
      Vibration.vibrate([50, 50, 50]);
      Alert.alert("Out of Stock", "This item is currently out of stock");
      return;
    }

    try {
      setAddingToCart(true);
      const result = await addToCart(currentUser.id, product.id, 1);

      if (result.success) {
        // Vibrate for success
        Vibration.vibrate(100);
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart!", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Item added to cart!");
        }
      } else {
        // Vibrate with pattern for error
        Vibration.vibrate([50, 50, 50]);
        Alert.alert("Error", result.error || "Failed to add item to cart");
      }
    } catch (error) {
      // Vibrate with pattern for error
      Vibration.vibrate([50, 50, 50]);
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setAddingToCart(false);
    }
  };

  const navigateToProduct = (productId, product) => {
    router.push({ pathname: `/item/${productId}`, params: { ...product } });
  };

  const getItemLayout = (_, index) => ({
    length: dimensions.cardWidth + dimensions.cardMargin * 2,
    offset: (dimensions.cardWidth + dimensions.cardMargin * 2) * index,
    index,
  });

  return (
    <View style={styles.wrapper}>
      {topProducts.length > 0 ? (
        <View style={styles.productSwiperContainer}>
          <View style={styles.swiperContainer}>
            <FlatList
              ref={flatListRef}
              data={topProducts}
              horizontal
              pagingEnabled={dimensions.cardWidth >= width * 0.8}
              snapToAlignment="center"
              snapToInterval={dimensions.cardWidth + dimensions.cardMargin * 2}
              decelerationRate="fast"
              keyExtractor={(item) => item.id || item._id}
              showsHorizontalScrollIndicator={false}
              getItemLayout={getItemLayout}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      width: dimensions.cardWidth,
                      marginHorizontal: dimensions.cardMargin,
                    },
                  ]}
                  onPress={() => navigateToProduct(item._id || item.id, item)}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={[styles.image, { height: dimensions.imageHeight }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      style={[
                        styles.image,
                        styles.imagePlaceholder,
                        { height: dimensions.imageHeight },
                      ]}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={dimensions.imageHeight * 0.3}
                        color="#ccc"
                      />
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <Text
                      style={[styles.title, { fontSize: dimensions.titleSize }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.cardDetails}>
                      <Text
                        style={[
                          styles.price,
                          { fontSize: dimensions.priceSize },
                        ]}
                      >
                        ${item.price}
                      </Text>
                      {!isAdmin && (
                        <TouchableOpacity
                          style={[
                            styles.cartButton,
                            {
                              paddingVertical: dimensions.buttonPadding,
                              paddingHorizontal: dimensions.buttonPadding * 1.5,
                            },
                            addingToCart && styles.disabledButton,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          disabled={addingToCart}
                        >
                          {addingToCart ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text
                              style={[
                                styles.cartButtonText,
                                { fontSize: dimensions.buttonTextSize },
                              ]}
                            >
                              Add to Cart
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <PaginationDots
            totalDots={topProducts.length}
            currentIndex={currentIndex}
            onDotPress={scrollToIndex}
          />
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
    marginBottom: 30,
  },
  image: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  productSwiperContainer: {
    width: "100%",
  },
  swiperContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 8,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(73, 94, 87, 0.3)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#495E57",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 280,
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontWeight: "bold",
    color: "#495E57",
  },
  price: {
    marginTop: 4,
    color: "#45474B",
    fontWeight: "600",
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartButton: {
    borderRadius: 4,
    backgroundColor: "#F4CE14",
    alignItems: "center",
    justifyContent: "center",
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
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
});
