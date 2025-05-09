import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SearchBar = ({ placeholder }) => {
  const router = useRouter();

  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleSearchPress}
      activeOpacity={0.7}
    >
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <Text style={styles.placeholderText}>{placeholder}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
  },
});

export default SearchBar;
