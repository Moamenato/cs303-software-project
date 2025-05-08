import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { db } from "../firebase/index";
import { collection, getDocs } from "firebase/firestore";

const SearchBar = ({ placeholder }) => {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "items"));
      const itemList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemList);
      setFilteredItems(itemList);
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (searchText === "") {
      setFilteredItems([]);
    } else {
      const filtered = items.filter((item) =>
        item.title.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchText, items]);

  const handleItemPress = (item) => {
    router.push({ pathname: `/item/${item.id}`, params: { ...item } })
    setIsFocused(false);
    setSearchText("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder={placeholder}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />

      {isFocused && filteredItems.length > 0 && (
        <TouchableWithoutFeedback onPress={() => {}} style={styles.overlay}>
          <View style={styles.resultsContainer}>
            <ScrollView
              style={styles.scrollView}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              {filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.itemContainer}
                  onPress={() => handleItemPress(item)}
                >
                  <Text style={styles.itemText}>{item.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
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
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  resultsContainer: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    maxHeight: 300,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  scrollView: {
    maxHeight: 298,
    paddingHorizontal: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemText: {
    fontSize: 16,
  },
});

export default SearchBar;