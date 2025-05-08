import React from "react";
import { View, StyleSheet } from "react-native";
import GetStarted from "../components/auth/GetStarted";

export default function Index() {
  return (
    <View style={styles.container}>
      <GetStarted />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
