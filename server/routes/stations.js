const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, requireStr, toNumber } = require('../utils');

const stations = db.collection('stations');
const bikes = db.collection('bikes');

function parseStation(body) {
  return {
    name: requireStr(body.name, 'Name'),
    location: (body.location || '').trim(),
    lat: body.lat === '' || body.lat == null ? null : toNumber(body.lat, 'Latitude', { min: -90, max: 90 }),
    lng: body.lng === '' || body.lng == null ? null : toNumber(body.lng, 'Longitude', { min: -180, max: 180 }),
    capacity: toNumber(body.capacity, 'Capacity', { min: 1, max: 500, integer: true }),
  };
}

router.use(protect, active);

// List stations with bike counts
router.get(
  '/',
  ah(async (req, res) => {
    const [stSnap, bikeSnap] = await Promise.all([stations.get(), bikes.get()]);
    const counts = {};
    bikeSnap.forEach((d) => {
      const b = d.data();
      if (!b.currentStation) return;
      counts[b.currentStation] ??= { total: 0, available: 0 };
      counts[b.currentStation].total++;
      if (b.status === 'available') counts[b.currentStation].available++;
    });
    const list = stSnap.docs
      .map(toObj)
      .map((s) => ({
        ...s,
        bikeCount: counts[s.id]?.total || 0,
        availableCount: counts[s.id]?.available || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(list);
  })
);

// Station detail with its bikes
router.get(
  '/:id',
  ah(async (req, res) => {
    const snap = await stations.doc(req.params.id).get();
    if (!snap.exists) throw new HttpError(404, 'Station not found');
    const bikeSnap = await bikes.where('currentStation', '==', req.params.id).get();
    const list = bikeSnap.docs.map(toObj).sort((a, b) => a.bikeCode.localeCompare(b.bikeCode));
    res.json({ ...toObj(snap), bikes: list });
  })
);

router.post(
  '/',
  adminOnly,
  ah(async (req, res) => {
    const data = { ...parseStation(req.body), createdAt: nowISO() };
    const ref = await stations.add(data);
    res.status(201).json({ id: ref.id, ...data });
  })
);

router.put(
  '/:id',
  adminOnly,
  ah(async (req, res) => {
    const ref = stations.doc(req.params.id);
    if (!(await ref.get()).exists) throw new HttpError(404, 'Station not found');
    const data = parseStation(req.body);
    const count = (await bikes.where('currentStation', '==', req.params.id).count().get()).data().count;
    if (data.capacity < count) {
      throw new HttpError(400, `Capacity cannot be less than the ${count} bikes currently docked here`);
    }
    await ref.update(data);
    res.json({ id: ref.id, ...(await ref.get()).data() });
  })
);

router.delete(
  '/:id',
  adminOnly,
  ah(async (req, res) => {
    const ref = stations.doc(req.params.id);
    if (!(await ref.get()).exists) throw new HttpError(404, 'Station not found');
    const count = (await bikes.where('currentStation', '==', req.params.id).count().get()).data().count;
    if (count > 0) throw new HttpError(400, 'Move or remove all bikes from this station first');
    await ref.delete();
    res.json({ message: 'Station deleted' });
  })
);

module.exports = router;
