const admin = require("firebase-admin");
const fs = require("fs");

// Load Firebase service account key
const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load orders data (array of objects)
const rawOrders = JSON.parse(
  fs.readFileSync("../firebase/DB/orders.json", "utf-8")
);

// Transform MongoDB-style docs to Firestore format
function transformOrder(doc) {
  return {
    userId: doc.user?.$oid,
    items: doc.items.map((item) => ({
      itemId: item.item?.$oid,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: doc.totalAmount,
    status: doc.status,
    createdAt: doc.createdAt?.$date,
  };
}

// Upload to Firestore
async function uploadOrders() {
  for (const doc of rawOrders) {
    const id = doc._id?.$oid;
    const orderData = transformOrder(doc);
    if (id) {
      await db.collection("orders").doc(id).set(orderData);
      console.log(`✅ Uploaded order ${id}`);
    }
  }
  console.log("🎉 All orders uploaded.");
}

uploadOrders().catch(console.error);
