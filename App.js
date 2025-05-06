import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView, View } from "react-native";
import Homepage from "./pages/homepage/Homepage";
import Footer from "./components/Footer";
import CategoriesScreen from "./pages/CategoriesScreen";
import ItemPage from "./components/ItemPage";
import CategoryItemsScreen from "./pages/CategoryItemsScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Stack = createStackNavigator();

const AppLayout = () => {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.wrapper}>
        <View style={styles.contentContainer}>
          <Stack.Navigator>
            <Stack.Screen
              name="Homepage"
              component={Homepage}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="CategoryItems"
              component={CategoryItemsScreen}
              options={{ title: "Category Items" }}
            />
            <Stack.Screen
              name="ItemPage"
              component={ItemPage}
              options={{ title: "Item Details" }}
            />
          </Stack.Navigator>
        </View>
        <Footer />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppLayout />
      </NavigationContainer>
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
    flexDirection: "column",
  },
  contentContainer: {
    flex: 1,
  },
});
