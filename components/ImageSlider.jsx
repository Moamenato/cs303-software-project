import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  useWindowDimensions,
} from "react-native";



export default function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef();
  const { width, height } = useWindowDimensions();

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



  return (
    <View style={[styles.sliderContainer, { width, height: height * 0.4 }]}>
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
            style={[styles.image, { width, height: height * 0.4 }]}
          />
        ))}
      </ScrollView>
      
      <View style={styles.dotContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  dotContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#F4CE14',
    width: 10,
    height: 10,
    borderRadius: 5,
  }
});
