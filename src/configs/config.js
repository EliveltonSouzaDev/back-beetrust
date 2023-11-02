const admin = require("firebase-admin");
const credentials = require("../../key.json");

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const db = admin.firestore();

const Product = db.collection("Products");
const Chat = db.collection("Chat");
const userChat = db.collection("userChat");

module.exports = {
  Product,
  Chat,
  userChat,
};