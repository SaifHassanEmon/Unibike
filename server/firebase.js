const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

if (!admin.apps.length) {
  let credential;

  // 1. If JSON content is provided as an environment variable (for Vercel / Cloud)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(parsed);
    } catch (err) {
      console.error('[UniBike] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      process.exit(1);
    }
  } else {
    // 2. Otherwise load from local file path
    const keyPath = path.resolve(
      __dirname,
      process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json'
    );

    if (!fs.existsSync(keyPath)) {
      console.error(
        `\n[UniBike] Firebase service account key not found at:\n  ${keyPath}\n` +
          'Download it from Firebase Console > Project settings > Service accounts > Generate new private key,\n' +
          'save it as server/serviceAccountKey.json (or set FIREBASE_SERVICE_ACCOUNT_JSON in .env).\n'
      );
      process.exit(1);
    }

    credential = admin.credential.cert(require(keyPath));
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db, FieldValue: admin.firestore.FieldValue };
