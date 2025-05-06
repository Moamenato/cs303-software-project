const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK
const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load and parse JSON
const rawCategories = JSON.parse(
  fs.readFileSync("../firebase/DB/categories.json", "utf-8")
);

// Transform MongoDB document to Firestore document
function transformCategory(doc) {
  return {
    name: doc.name,
    description: doc.description,
    createdAt: new Date(doc.createdAt.$date), // Convert ISO string to JS Date
  };
}

// Upload to Firestore
async function uploadCategories() {
  for (const doc of rawCategories) {
    const id = doc._id?.$oid;
    const data = transformCategory(doc);
    if (id) {
      await db.collection("categories").doc(id).set(data);
      console.log(`✅ Uploaded category ${id}`);
    }
  }
  console.log("🎉 All categories uploaded.");
}

uploadCategories().catch(console.error);
