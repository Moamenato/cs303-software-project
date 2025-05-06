const admin = require("firebase-admin");
const fs = require("fs");

// Load Firebase service account key
const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load items data (array of objects)
const rawItems = JSON.parse(
  fs.readFileSync("../firebase/DB/items.json", "utf-8")
);

// Transform MongoDB-style docs to Firestore format
function transformItem(doc) {
  return {
    title: doc.title,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    tags: doc.tags,
  };
}

// Upload to Firestore
async function uploadItems() {
  for (const doc of rawItems) {
    const id = doc._id?.$oid;
    const itemData = transformItem(doc);
    if (id) {
      await db.collection("items").doc(id).set(itemData);
      console.log(`✅ Uploaded item ${id}`);
    }
  }
  console.log("🎉 All items uploaded.");
}

uploadItems().catch(console.error);
