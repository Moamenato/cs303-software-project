const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const data = JSON.parse(fs.readFileSync("../firebase/DB/carts.json", "utf-8"));

function convertMongoDoc(doc) {
  const docId = doc._id?.$oid;
  const userId = doc.user?.$oid;
  const createdAt = new Date(doc.createdAt?.$date);

  const items = (doc.items || []).map((i) => ({
    itemId: i.item?.$oid,
    quantity: i.quantity,
  }));

  return {
    id: docId,
    userId,
    items,
    createdAt,
  };
}

async function uploadCarts() {
  for (const doc of data) {
    const clean = convertMongoDoc(doc);
    const { id, ...docData } = clean;
    if (id) {
      await db.collection("carts").doc(id).set(docData);
    }
  }
  console.log("✅ carts uploaded to Firestore.");
}

uploadCarts().catch(console.error);
