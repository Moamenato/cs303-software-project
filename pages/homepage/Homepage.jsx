import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { db, collection, getDocs } from "../../firebaseConfig";
import ImageSlider from "../../components/ImageSlider";
import SectionHeader from "../../components/SectionHeader";
import ProductSwiper from "../../components/ProductSwiper";
import Header from "../../components/Header.jsx";
import { SafeAreaView } from "react-native-safe-area-context";

const images = [
  require("../../assets/image1.jpg"),
  require("../../assets/image2.jpg"),
  require("../../assets/image3.jpg"),
];

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "items");
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <ImageSlider images={images} />
        <View style={styles.section}>
          <SectionHeader heading="Featured Products" />
          <ProductSwiper products={products} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingBottom: 50,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
