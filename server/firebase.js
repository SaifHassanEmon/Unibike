const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

function initFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  let credential;

  // 1. If JSON content is provided as an environment variable (for Vercel / Cloud)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
      const parsed = JSON.parse(raw);
      // Ensure private key newlines are handled correctly in cloud environments
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(parsed);
    } catch (err) {
      console.error('[UniBike] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
      throw err;
    }
  } else {
    // 2. Otherwise load from local file path
    const keyPath = path.resolve(
      __dirname,
      process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json'
    );

    if (!fs.existsSync(keyPath)) {
      const msg = `[UniBike] Firebase service account key not found at ${keyPath} and FIREBASE_SERVICE_ACCOUNT_JSON is not set.`;
      console.error(msg);
      throw new Error(msg);
    }

    credential = admin.credential.cert(require(keyPath));
  }

  return admin.initializeApp({ credential });
}

initFirebase();

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db, FieldValue: admin.firestore.FieldValue };
