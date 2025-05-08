import React from "react";
import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";

export default function Layout() {
  const _path = usePathname();
  const hideFooter =
    _path !== "/" && _path !== "/auth/login" && _path !== "/auth/register";
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeAreaContainer}>
          <View style={styles.wrapper}>
            <View style={styles.contentContainer}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
            {hideFooter && <Footer />}
          </View>
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
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
