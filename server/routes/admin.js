const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, byDateDesc, toNumber } = require('../utils');

router.use(protect, active, adminOnly);

router.get(
  '/stats',
  ah(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 6 * 86400000);

    const [bikeSnap, stationCount, studentCount, activeRides, openIssues, txSnap, rideSnap] = await Promise.all([
      db.collection('bikes').get(),
      db.collection('stations').count().get(),
      db.collection('users').where('role', '==', 'student').count().get(),
      db.collection('rides').where('status', '==', 'active').count().get(),
      db.collection('issues').where('status', '!=', 'resolved').count().get(),
      db.collection('transactions').where('createdAt', '>=', weekAgo.toISOString()).get(),
      db.collection('rides').where('startTime', '>=', weekAgo.toISOString()).get(),
    ]);

    const bikes = { total: bikeSnap.size, available: 0, in_use: 0, maintenance: 0 };
    bikeSnap.forEach((d) => (bikes[d.data().status] = (bikes[d.data().status] || 0) + 1));

    // Build last-7-days series
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo.getTime() + i * 86400000);
      days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), rides: 0, revenue: 0 });
    }
    const dayMap = Object.fromEntries(days.map((d) => [d.key, d]));
    let revenueToday = 0;
    txSnap.forEach((d) => {
      const tx = d.data();
      if (tx.type !== 'ride_payment' && tx.type !== 'overtime') return;
      const when = new Date(tx.createdAt);
      const day = dayMap[when.toDateString()];
      if (day) day.revenue += -tx.amount;
      if (when >= today) revenueToday += -tx.amount;
    });
    const stationUse = {};
    rideSnap.forEach((d) => {
      const r = d.data();
      const day = dayMap[new Date(r.startTime).toDateString()];
      if (day) day.rides++;
      stationUse[r.startStationName] = (stationUse[r.startStationName] || 0) + 1;
    });

    res.json({
      bikes,
      stations: stationCount.data().count,
      students: studentCount.data().count,
      activeRides: activeRides.data().count,
      openIssues: openIssues.data().count,
      revenueToday: Math.round(revenueToday * 100) / 100,
      week: days.map(({ key, ...rest }) => rest),
      topStations: Object.entries(stationUse)
        .map(([name, rides]) => ({ name, rides }))
        .sort((a, b) => b.rides - a.rides)
        .slice(0, 5),
    });
  })
);

router.get(
  '/users',
  ah(async (req, res) => {
    const snap = await db.collection('users').where('role', '==', 'student').get();
    res.json(snap.docs.map(toObj).sort(byDateDesc('createdAt')));
  })
);

// Block/unblock a student or adjust their wallet balance.
router.put(
  '/users/:id',
  ah(async (req, res) => {
    const ref = db.collection('users').doc(req.params.id);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) throw new HttpError(404, 'User not found');
      const user = snap.data();
      if (user.role === 'admin') throw new HttpError(400, 'Cannot modify an admin account');

      const update = {};
      if (req.body.isBlocked !== undefined) update.isBlocked = Boolean(req.body.isBlocked);
      if (req.body.walletAdjust !== undefined && req.body.walletAdjust !== '') {
        const amt = toNumber(req.body.walletAdjust, 'Adjustment', { min: -100000, max: 100000 });
        if (amt !== 0) {
          update.walletBalance = Math.round((user.walletBalance + amt) * 100) / 100;
          t.set(db.collection('transactions').doc(), {
            userId: ref.id,
            type: 'admin_adjust',
            amount: amt,
            description: req.body.reason || 'Adjusted by admin',
            createdAt: nowISO(),
          });
        }
      }
      t.update(ref, update);
    });
    res.json(toObj(await ref.get()));
  })
);

module.exports = router;
