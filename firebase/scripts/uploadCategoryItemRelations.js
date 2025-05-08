const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const rawRelations = JSON.parse(
  fs.readFileSync("../firebase/DB/categoryitemrelations.json", "utf-8")
);
function transformRelation(doc) {
  return {
    category: doc.category?.$oid,
    items: doc.items?.map((item) => item.$oid) || [],
    createdAt: new Date(doc.createdAt.$date),
  };
}

async function uploadRelations() {
  for (const doc of rawRelations) {
    const id = doc._id?.$oid;
    const data = transformRelation(doc);
    if (id) {
      await db.collection("categoryItemRelations").doc(id).set(data);
      console.log(`✅ Uploaded relation ${id}`);
    }
  }
  console.log("🎉 All category-item relations uploaded.");
}

uploadRelations().catch(console.error);
