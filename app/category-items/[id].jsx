import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  doc,
  db,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "../../firebase/index";
import { useLocalSearchParams, useRouter } from "expo-router";
import ItemCard from "../../components/ItemCard";

export default function CategoryItemsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "categoryItemRelations"),
          where("category", "==", id)
        );
        const relationSnapshot = await getDocs(q);
        if (relationSnapshot.empty) return;

        const relationData = relationSnapshot.docs[0].data();
        const itemIds = relationData.items;
        const fetchedItems = [];

        for (let itemId of itemIds) {
          const itemDoc = await getDoc(doc(db, "items", itemId));
          if (itemDoc.exists()) {
            fetchedItems.push({ id: itemDoc.id, ...itemDoc.data() });
          }
        }
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching category items:", error);
      }
    };

    fetchItems();
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace("/categories")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#495E57" />
        </TouchableOpacity>
        <Text style={styles.header}>{name}</Text>
      </View>

      <FlatList
        style={styles.flatList}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: `/item/${item.id}`, params: { ...item } })
            }
          >
            <ItemCard item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginTop: 20,
    marginRight: 10,
  },
  header: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#495E57",
  },
  flatList: {
    marginBottom: 55,
  },
});
