import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5 } from "@expo/vector-icons";
import SearchBar from "./SearchBar.jsx";

export default function Header() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Image
            source={require("../assets/logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.searchWrapper}>
          <SearchBar placeholder="Search here..." caseSensitive={false} />
        </View>

        {user && (
          <View style={styles.auth}>
            <TouchableOpacity
              style={styles.authBtn}
              onPress={() => navigation.navigate("Profile")}
            >
              <FontAwesome5 name="user" style={styles.icon} />
              <Text style={styles.authText}>{user.name || "Profile"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" style={styles.icon} />
              <Text style={styles.authText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: "#F5F7F8",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  container: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  left: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  searchWrapper: {
    flex: 1,
    marginHorizontal: 15,
  },
  auth: {
    flexDirection: "row",
    gap: 10,
  },
  authBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  authText: {
    fontSize: 11,
    color: "#45474B",
  },
  icon: {
    fontSize: 20,
    color: "#495E57",
  },
});
