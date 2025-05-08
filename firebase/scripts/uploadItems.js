const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const rawItems = JSON.parse(
  fs.readFileSync("../firebase/DB/items.json", "utf-8")
);
function transformItem(doc) {
  return {
    title: doc.title,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    tags: doc.tags,
  };
}

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
