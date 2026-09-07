const admin = require('firebase-admin');
const serviceAccount = require('../firebase-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fatima-16b38-default-rtdb.firebaseio.com/"
  });
}

module.exports = admin;
