import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Text,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      scrollToIndex(nextIndex);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [currentIndex]);

  const scrollToIndex = (index) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  const prevSlide = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    scrollToIndex(newIndex);
  };

  const nextSlide = () => {
    const newIndex = (currentIndex + 1) % images.length;
    scrollToIndex(newIndex);
  };

  return (
    <View style={styles.sliderContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={typeof image === "string" ? { uri: image } : image}
            style={styles.image}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.navButton, styles.prev]}
        onPress={prevSlide}
      >
        <Text style={styles.navText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, styles.next]}
        onPress={nextSlide}
      >
        <Text style={styles.navText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    width,
    height: height * 0.4,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width,
    height: height * 0.4,
    resizeMode: "cover",
  },
  navButton: {
    position: "absolute",
    backgroundColor: "rgba(73, 94, 87, 0.7)",
    padding: 10,
    borderRadius: 30,
    zIndex: 1,
    top: "45%",
  },
  prev: {
    left: 10,
  },
  next: {
    right: 10,
  },
  navText: {
    color: "#F4CE14",
    fontSize: 30,
    fontWeight: "bold",
  },
});
