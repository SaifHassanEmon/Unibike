const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, requireStr } = require('../utils');

const bikes = db.collection('bikes');
const stations = db.collection('stations');
const EDITABLE_STATUSES = ['available', 'maintenance'];

router.use(protect, active, adminOnly);

/** Throws if the station doesn't exist or is full (excluding the given bike). */
async function assertStationHasRoom(stationId, excludeBikeId) {
  const st = await stations.doc(stationId).get();
  if (!st.exists) throw new HttpError(400, 'Station not found');
  const docked = await bikes.where('currentStation', '==', stationId).get();
  const count = docked.docs.filter((d) => d.id !== excludeBikeId).length;
  if (count >= st.data().capacity) throw new HttpError(400, `Station "${st.data().name}" is full`);
  return st.data();
}

router.get(
  '/',
  ah(async (req, res) => {
    let q = bikes;
    if (req.query.station) q = q.where('currentStation', '==', req.query.station);
    if (req.query.status) q = q.where('status', '==', req.query.status);
    const [snap, stSnap] = await Promise.all([q.get(), stations.get()]);
    const names = Object.fromEntries(stSnap.docs.map((d) => [d.id, d.data().name]));
    const list = snap.docs
      .map(toObj)
      .map((b) => ({ ...b, stationName: b.currentStation ? names[b.currentStation] || '—' : null }))
      .sort((a, b) => a.bikeCode.localeCompare(b.bikeCode));
    res.json(list);
  })
);

router.post(
  '/',
  ah(async (req, res) => {
    const bikeCode = requireStr(req.body.bikeCode, 'Bike code').toUpperCase();
    const model = (req.body.model || '').trim();
    const status = req.body.status || 'available';
    const currentStation = requireStr(req.body.currentStation, 'Station');
    if (!EDITABLE_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

    const dup = await bikes.where('bikeCode', '==', bikeCode).limit(1).get();
    if (!dup.empty) throw new HttpError(400, 'A bike with this code already exists');
    await assertStationHasRoom(currentStation);

    const data = { bikeCode, model, status, currentStation, createdAt: nowISO() };
    const ref = await bikes.add(data);
    res.status(201).json({ id: ref.id, ...data });
  })
);

router.put(
  '/:id',
  ah(async (req, res) => {
    const ref = bikes.doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Bike not found');
    const bike = snap.data();
    if (bike.status === 'in_use') throw new HttpError(400, 'Bike is currently in use and cannot be edited');

    const update = {};
    if (req.body.bikeCode !== undefined) {
      const code = requireStr(req.body.bikeCode, 'Bike code').toUpperCase();
      if (code !== bike.bikeCode) {
        const dup = await bikes.where('bikeCode', '==', code).limit(1).get();
        if (!dup.empty) throw new HttpError(400, 'A bike with this code already exists');
      }
      update.bikeCode = code;
    }
    if (req.body.model !== undefined) update.model = String(req.body.model).trim();
    if (req.body.status !== undefined) {
      if (!EDITABLE_STATUSES.includes(req.body.status)) throw new HttpError(400, 'Invalid status');
      update.status = req.body.status;
    }
    if (req.body.currentStation && req.body.currentStation !== bike.currentStation) {
      await assertStationHasRoom(req.body.currentStation, ref.id);
      update.currentStation = req.body.currentStation;
    }
    await ref.update(update);
    res.json({ id: ref.id, ...(await ref.get()).data() });
  })
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    const ref = bikes.doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Bike not found');
    if (snap.data().status === 'in_use') throw new HttpError(400, 'Cannot delete a bike that is in use');
    await ref.delete();
    res.json({ message: 'Bike deleted' });
  })
);

module.exports = router;
