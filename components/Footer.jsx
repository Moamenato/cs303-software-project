import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function Footer() {
  const navigation = useNavigation();

  const resetToMenu = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: "Homepage" }, { name: "Categories" }],
      })
    );
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.newIconContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Homepage" }],
              })
            );
          }}
        >
          <Ionicons name="home" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="person" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="cart" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={resetToMenu}>
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
  },
});
