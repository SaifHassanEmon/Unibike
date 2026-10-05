const router = require('express').Router();
const { db } = require('../firebase');
const { protect } = require('../middleware/auth');
const { ah, HttpError, nowISO, requireStr } = require('../utils');

// Create the profile document right after Firebase Auth sign-up.
router.post(
  '/profile',
  protect,
  ah(async (req, res) => {
    if (req.user) return res.json(req.user);

    const name = requireStr(req.body.name, 'Name');
    const studentId = requireStr(req.body.studentId, 'Student ID');
    const domain = (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase();
    if (domain && !String(req.email).toLowerCase().endsWith('@' + domain)) {
      throw new HttpError(400, `Please use your university email (@${domain})`);
    }

    const dup = await db.collection('users').where('studentId', '==', studentId).limit(1).get();
    if (!dup.empty) throw new HttpError(400, 'This Student ID is already registered');

    const profile = {
      name,
      studentId,
      email: req.email,
      role: 'student',
      walletBalance: 0,
      isBlocked: false,
      activeRideId: null,
      createdAt: nowISO(),
    };
    await db.collection('users').doc(req.uid).set(profile);
    res.status(201).json({ id: req.uid, ...profile });
  })
);

router.get('/me', protect, (req, res) => {
  if (!req.user) return res.status(404).json({ message: 'Profile not found' });
  res.json(req.user);
});

module.exports = router;
