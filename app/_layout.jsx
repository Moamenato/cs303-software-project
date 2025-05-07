import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar"; // ✅ Correct StatusBar
import Footer from "../components/Footer";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.wrapper}>
          <View style={styles.contentContainer}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          <Footer />
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
