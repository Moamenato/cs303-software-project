import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function SectionHeader({ heading, description }) {
  return (
    <View style={styles.container}>
      <View style={styles.headingWrapper}>
        <Text style={styles.heading}>{heading}</Text>
        <View style={styles.underline} />
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    marginBottom: 40,
    alignItems: "center",
  },
  headingWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    color: "#333",
    fontWeight: "bold",
    fontFamily: "Montserrat",
  },
  underline: {
    marginTop: 8,
    width: width * 0.2,
    height: 3,
    backgroundColor: "#F4CE14",
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
