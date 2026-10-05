const { admin, db } = require('../firebase');

/** Verifies the Firebase ID token and loads the user's profile document. */
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    const snap = await db.collection('users').doc(decoded.uid).get();
    req.user = snap.exists ? { id: snap.id, ...snap.data() } : null;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/** Requires a profile document to exist and the account not to be blocked. */
function active(req, res, next) {
  if (!req.user) return res.status(403).json({ message: 'Profile not found' });
  if (req.user.isBlocked) return res.status(403).json({ message: 'Your account is blocked. Contact the admin.' });
  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
}

module.exports = { protect, active, adminOnly };
