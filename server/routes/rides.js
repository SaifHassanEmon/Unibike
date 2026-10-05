const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, byDateDesc, requireStr } = require('../utils');

const users = db.collection('users');
const bikes = db.collection('bikes');
const plans = db.collection('plans');
const stations = db.collection('stations');
const rides = db.collection('rides');
const transactions = db.collection('transactions');

const round2 = (n) => Math.round(n * 100) / 100;

router.use(protect, active);

// Start a ride: pay plan price up front, bike becomes in_use.
router.post(
  '/start',
  ah(async (req, res) => {
    const bikeId = requireStr(req.body.bikeId, 'Bike');
    const planId = requireStr(req.body.planId, 'Plan');
    if (req.user.role === 'admin') throw new HttpError(400, 'Admins cannot rent bikes');

    const rideRef = rides.doc();
    const ride = await db.runTransaction(async (t) => {
      const userRef = users.doc(req.uid);
      const bikeRef = bikes.doc(bikeId);
      const planRef = plans.doc(planId);
      const [userSnap, bikeSnap, planSnap] = await Promise.all([
        t.get(userRef),
        t.get(bikeRef),
        t.get(planRef),
      ]);

      const user = userSnap.data();
      if (user.activeRideId) throw new HttpError(400, 'You already have an active ride');
      if (!bikeSnap.exists) throw new HttpError(404, 'Bike not found');
      if (!planSnap.exists || !planSnap.data().isActive) throw new HttpError(404, 'Plan not available');

      const bike = bikeSnap.data();
      const plan = planSnap.data();
      if (bike.status !== 'available' || !bike.currentStation) {
        throw new HttpError(400, 'This bike is not available');
      }
      if (user.walletBalance < plan.price) {
        throw new HttpError(400, `Insufficient balance. Plan costs ৳${plan.price}, you have ৳${user.walletBalance}`);
      }

      const stationSnap = await t.get(stations.doc(bike.currentStation));
      const start = new Date();
      const data = {
        userId: req.uid,
        userName: user.name,
        userEmail: user.email,
        bikeId,
        bikeCode: bike.bikeCode,
        planId,
        planName: plan.name,
        durationMinutes: plan.durationMinutes,
        overtimeRatePerMin: plan.overtimeRatePerMin,
        startStationId: bike.currentStation,
        startStationName: stationSnap.exists ? stationSnap.data().name : '—',
        endStationId: null,
        endStationName: null,
        startTime: start.toISOString(),
        expectedEndTime: new Date(start.getTime() + plan.durationMinutes * 60000).toISOString(),
        endTime: null,
        baseCost: plan.price,
        overtimeMinutes: 0,
        overtimeCost: 0,
        totalCost: plan.price,
        status: 'active',
      };

      t.set(rideRef, data);
      t.update(userRef, { walletBalance: round2(user.walletBalance - plan.price), activeRideId: rideRef.id });
      t.update(bikeRef, { status: 'in_use', currentStation: null });
      t.set(transactions.doc(), {
        userId: req.uid,
        type: 'ride_payment',
        amount: -plan.price,
        rideId: rideRef.id,
        description: `${plan.name} — bike ${bike.bikeCode}`,
        createdAt: data.startTime,
      });
      return data;
    });

    res.status(201).json({ id: rideRef.id, ...ride });
  })
);

// End a ride at a station. Owner or admin (force end).
router.post(
  '/:id/end',
  ah(async (req, res) => {
    const stationId = requireStr(req.body.stationId, 'Return station');
    const rideRef = rides.doc(req.params.id);

    const result = await db.runTransaction(async (t) => {
      const rideSnap = await t.get(rideRef);
      if (!rideSnap.exists) throw new HttpError(404, 'Ride not found');
      const ride = rideSnap.data();
      if (ride.userId !== req.uid && req.user.role !== 'admin') throw new HttpError(403, 'Not your ride');
      if (ride.status !== 'active') throw new HttpError(400, 'Ride already ended');

      const userRef = users.doc(ride.userId);
      const stationRef = stations.doc(stationId);
      const [stationSnap, dockedSnap, userSnap] = await Promise.all([
        t.get(stationRef),
        t.get(bikes.where('currentStation', '==', stationId)),
        t.get(userRef),
      ]);
      if (!stationSnap.exists) throw new HttpError(404, 'Station not found');
      const station = stationSnap.data();
      if (dockedSnap.size >= station.capacity) {
        throw new HttpError(400, `Station "${station.name}" is full. Please choose another station.`);
      }

      const end = new Date();
      const overMs = end.getTime() - new Date(ride.expectedEndTime).getTime();
      const overtimeMinutes = overMs > 0 ? Math.ceil(overMs / 60000) : 0;
      const overtimeCost = round2(overtimeMinutes * ride.overtimeRatePerMin);
      const forced = ride.userId !== req.uid;

      const update = {
        endStationId: stationId,
        endStationName: station.name,
        endTime: end.toISOString(),
        overtimeMinutes,
        overtimeCost,
        totalCost: round2(ride.baseCost + overtimeCost),
        status: 'completed',
        forceEnded: forced,
      };
      t.update(rideRef, update);
      t.update(bikes.doc(ride.bikeId), { status: 'available', currentStation: stationId });

      const user = userSnap.data();
      // Overtime may push the wallet negative; the student must top up before the next ride.
      t.update(userRef, {
        walletBalance: round2(user.walletBalance - overtimeCost),
        activeRideId: null,
      });
      if (overtimeCost > 0) {
        t.set(transactions.doc(), {
          userId: ride.userId,
          type: 'overtime',
          amount: -overtimeCost,
          rideId: rideRef.id,
          description: `Overtime ${overtimeMinutes} min — bike ${ride.bikeCode}`,
          createdAt: update.endTime,
        });
      }
      return { ...ride, ...update };
    });

    res.json({ id: rideRef.id, ...result });
  })
);

router.get(
  '/active',
  ah(async (req, res) => {
    if (!req.user.activeRideId) return res.json(null);
    const snap = await rides.doc(req.user.activeRideId).get();
    res.json(snap.exists ? toObj(snap) : null);
  })
);

router.get(
  '/me',
  ah(async (req, res) => {
    const snap = await rides.where('userId', '==', req.uid).get();
    res.json(snap.docs.map(toObj).sort(byDateDesc('startTime')));
  })
);

router.get(
  '/',
  adminOnly,
  ah(async (req, res) => {
    let q = rides;
    if (req.query.status) q = q.where('status', '==', req.query.status);
    const snap = await q.get();
    res.json(snap.docs.map(toObj).sort(byDateDesc('startTime')).slice(0, 300));
  })
);

module.exports = router;
