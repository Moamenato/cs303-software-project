import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, StyleSheet } from "react-native";
import { db } from "../firebase/index";
import { collection, getDocs } from "firebase/firestore";

const SearchBar = ({ placeholder }) => {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "items"));
      const itemList = querySnapshot.docs.map((doc) => doc.data());
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
        <View style={styles.resultsContainer}>
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>{item.title}</Text>
              </View>
            )}
            style={styles.resultsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
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
  },
  resultsList: {
    paddingHorizontal: 10,
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
