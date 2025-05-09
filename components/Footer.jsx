import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  return (
    <View style={styles.footerContainer}>
      <View style={styles.newIconContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.replace("/home")}
        >
          <Ionicons name="home" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.replace("/auth/profile")}
        >
          <Ionicons name="person" size={30} color="white" />
        </TouchableOpacity>

        {isAdmin ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/admin")}
          >
            <FontAwesome5 name="shield-alt" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.replace("/cart")}
          >
            <Ionicons name="cart" size={30} color="white" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.replace("/categories")}
        >
          <Ionicons name="grid-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "#495E57",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 10,
  },
  newIconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  iconButton: {
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
});
