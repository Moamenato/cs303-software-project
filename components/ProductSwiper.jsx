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
} from "react-native";
import { useRouter } from "expo-router";

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
      {/* Show all dots with sliding window */}
      {Array.from({ length: endDot - startDot }).map((_, i) => {
        const dotIndex = startDot + i;
        return (
          <TouchableOpacity 
            key={dotIndex} 
            onPress={() => onDotPress(dotIndex)}
            style={[
              styles.dot,
              currentIndex === dotIndex && styles.activeDot
            ]}
          />
        );
      })}
    </View>
  );
};

export default function ProductSwiper({ products }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [topProducts, setTopProducts] = useState([]);
  
  useEffect(() => {
    if (products && products.length > 0) {
      const sorted = [...products].sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return (b._id || b.id) - (a._id || a.id);
      });
      
      setTopProducts(sorted.slice(0, 10));
    } else {
      setTopProducts([]);
    }
  }, [products]);

  const calculateProductsPerView = () => {
    if (width < 400) return 1; 
    if (width < 600) return 1.5; 
    return 2; 
  };

  const productsPerView = calculateProductsPerView();
  const cardMargin = 8;
  const cardWidth = (width - 32 - (cardMargin * 2 * productsPerView)) / productsPerView;

  const scrollToIndex = (index) => {
    if (flatListRef.current && topProducts.length > 0) {
      setCurrentIndex(index);
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5 
      });
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(contentOffset / (cardWidth + cardMargin * 2));
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const addToCart = (product, e) => {
    e.stopPropagation(); 
    Alert.alert("Add to Cart", `${product.title} added to cart!`);
  };

  const navigateToProduct = (productId, product) => {
    router.push({ pathname: `/item/${productId}`, params: { ...product } })
  };

  const getItemLayout = (_, index) => ({
    length: cardWidth + cardMargin * 2,
    offset: (cardWidth + cardMargin * 2) * index,
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
              pagingEnabled={productsPerView === 1}
              snapToAlignment="center"
              snapToInterval={cardWidth + cardMargin * 2}
              decelerationRate="fast"
              keyExtractor={(item) => item.id || item._id}
              showsHorizontalScrollIndicator={false}
              getItemLayout={getItemLayout}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.card, { 
                    width: cardWidth,
                    marginHorizontal: cardMargin 
                  }]}
                  onPress={() => navigateToProduct(item._id || item.id, item)}
                >
                  <Image
                    source={{
                      uri: `${process.env.EXPO_PUBLIC_BASEURL}/images/item/${item._id || item.id}`,
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.price}>${item.price}</Text>
                    <TouchableOpacity
                      style={styles.cartButton}
                      onPress={(e) => addToCart(item, e)}
                    >
                      <Text style={styles.cartButtonText}>Add to Cart</Text>
                    </TouchableOpacity>
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
  productSwiperContainer: {
    width: '100%',
  },
  swiperContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 8, 
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(73, 94, 87, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#495E57',
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
  image: {
    width: "100%",
    height: 130,
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495E57",
  },
  price: {
    marginTop: 4,
    fontSize: 14,
    color: "#45474B",
    fontWeight: "600",
  },
  cartButton: {
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#F4CE14",
    alignItems: "center",
  },
  cartButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  noProducts: {
    textAlign: "center",
    color: "#495E57",
    fontSize: 16,
  },
});