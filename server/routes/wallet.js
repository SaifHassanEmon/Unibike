const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active } = require('../middleware/auth');
const { ah, toObj, nowISO, byDateDesc, toNumber } = require('../utils');

router.use(protect, active);

router.get(
  '/',
  ah(async (req, res) => {
    const snap = await db.collection('transactions').where('userId', '==', req.uid).get();
    res.json({
      balance: req.user.walletBalance,
      transactions: snap.docs.map(toObj).sort(byDateDesc('createdAt')),
    });
  })
);

// Simulated top-up. Replace with a real payment gateway (bKash/SSLCommerz) later.
router.post(
  '/topup',
  ah(async (req, res) => {
    const amount = toNumber(req.body.amount, 'Amount', { min: 10, max: 5000 });
    const userRef = db.collection('users').doc(req.uid);
    const balance = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      const newBalance = Math.round((snap.data().walletBalance + amount) * 100) / 100;
      t.update(userRef, { walletBalance: newBalance });
      t.set(db.collection('transactions').doc(), {
        userId: req.uid,
        type: 'topup',
        amount,
        description: `Wallet top-up (${req.body.method || 'demo'})`,
        createdAt: nowISO(),
      });
      return newBalance;
    });
    res.json({ balance });
  })
);

module.exports = router;
