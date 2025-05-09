const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const rawFeedbacks = JSON.parse(
  fs.readFileSync("../firebase/DB/feedbacks.json", "utf-8")
);
function transformFeedback(doc) {
  return {
    item: doc.item?.$oid,
    user: doc.user?.$oid,
    rating: doc.rating,
    comment: doc.comment,
    createdAt: new Date(doc.createdAt.$date),
  };
}

async function uploadFeedbacks() {
  for (const doc of rawFeedbacks) {
    const id = doc._id?.$oid;
    const data = transformFeedback(doc);
    if (id) {
      await db.collection("feedbacks").doc(id).set(data);
      console.log(`✅ Uploaded feedback ${id}`);
    }
  }
  console.log("🎉 All feedbacks uploaded.");
}

uploadFeedbacks().catch(console.error);
