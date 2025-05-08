const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("../epichardware-d1a40-firebase-adminsdk-fbsvc-2dc80e839c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const rawUsers = JSON.parse(
  fs.readFileSync("../firebase/DB/users.json", "utf-8")
);
function transformUser(doc) {
  return {
    name: doc.name,
    email: doc.email,
    phone_number: doc.phone_number,
    password: doc.password,
    isAdmin: doc.isAdmin,
    createdAt: doc.createdAt?.$date,
    updatedAt: doc.updatedAt?.$date,
  };
}

async function uploadUsers() {
  for (const doc of rawUsers) {
    const id = doc._id?.$oid;
    const userData = transformUser(doc);
    if (id) {
      await db.collection("users").doc(id).set(userData);
      console.log(`✅ Uploaded user ${id}`);
    }
  }
  console.log("🎉 All users uploaded.");
}

uploadUsers().catch(console.error);
