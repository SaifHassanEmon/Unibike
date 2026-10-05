const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, byDateDesc, requireStr } = require('../utils');

const issues = db.collection('issues');
const STATUSES = ['open', 'in_progress', 'resolved'];

router.use(protect, active);

router.post(
  '/',
  ah(async (req, res) => {
    const bikeCode = requireStr(req.body.bikeCode, 'Bike code').toUpperCase();
    const description = requireStr(req.body.description, 'Description');
    const bikeSnap = await db.collection('bikes').where('bikeCode', '==', bikeCode).limit(1).get();
    if (bikeSnap.empty) throw new HttpError(404, 'No bike found with that code');

    const data = {
      userId: req.uid,
      userName: req.user.name,
      bikeId: bikeSnap.docs[0].id,
      bikeCode,
      category: req.body.category || 'other',
      description,
      status: 'open',
      createdAt: nowISO(),
    };
    const ref = await issues.add(data);
    res.status(201).json({ id: ref.id, ...data });
  })
);

router.get(
  '/me',
  ah(async (req, res) => {
    const snap = await issues.where('userId', '==', req.uid).get();
    res.json(snap.docs.map(toObj).sort(byDateDesc('createdAt')));
  })
);

router.get(
  '/',
  adminOnly,
  ah(async (req, res) => {
    const snap = await issues.get();
    res.json(snap.docs.map(toObj).sort(byDateDesc('createdAt')));
  })
);

router.put(
  '/:id',
  adminOnly,
  ah(async (req, res) => {
    const ref = issues.doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Issue not found');
    const update = {};
    if (req.body.status) {
      if (!STATUSES.includes(req.body.status)) throw new HttpError(400, 'Invalid status');
      update.status = req.body.status;
      if (req.body.status === 'resolved') update.resolvedAt = nowISO();
    }
    if (req.body.adminNote !== undefined) update.adminNote = String(req.body.adminNote);

    if (req.body.sendToMaintenance) {
      const bikeRef = db.collection('bikes').doc(snap.data().bikeId);
      const bike = await bikeRef.get();
      if (!bike.exists) throw new HttpError(404, 'Bike no longer exists');
      if (bike.data().status === 'in_use') throw new HttpError(400, 'Bike is in use; try again after it is returned');
      await bikeRef.update({ status: 'maintenance' });
    }
    await ref.update(update);
    res.json({ id: ref.id, ...(await ref.get()).data() });
  })
);

module.exports = router;
