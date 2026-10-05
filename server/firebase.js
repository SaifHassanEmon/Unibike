const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const keyPath = path.resolve(
  __dirname,
  process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json'
);

if (!fs.existsSync(keyPath)) {
  console.error(
    `\n[UniBike] Firebase service account key not found at:\n  ${keyPath}\n` +
      'Download it from Firebase Console > Project settings > Service accounts > Generate new private key,\n' +
      'save it as server/serviceAccountKey.json (or set FIREBASE_SERVICE_ACCOUNT in server/.env).\n'
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db, FieldValue: admin.firestore.FieldValue };
