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
} from "../firebaseConfig";
import { useRoute } from "@react-navigation/native";
import ItemCard from "../components/ItemCard";
import { useNavigation } from "@react-navigation/native";

export default function CategoryItemsScreen() {
  const navigation = useNavigation();
  const { categoryId, categoryName } = useRoute().params;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "categoryItemRelations"),
          where("category", "==", categoryId)
        );

        const relationSnapshot = await getDocs(q);

        if (relationSnapshot.empty) return;

        const relationData = relationSnapshot.docs[0].data();
        const itemIds = relationData.items;

        const fetchedItems = [];

        for (let id of itemIds) {
          const itemDoc = await getDoc(doc(db, "items", id));
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
  }, [categoryId]);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName}</Text>
      <FlatList
        style={styles.flatList}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("ItemPage", { item })}
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
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#495E57",
  },
  flatList: {
    marginBottom: 55,
  },
});
