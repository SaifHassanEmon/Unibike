const router = require('express').Router();
const { db } = require('../firebase');
const { protect, active, adminOnly } = require('../middleware/auth');
const { ah, HttpError, toObj, nowISO, requireStr, toNumber } = require('../utils');

const plans = db.collection('plans');

function parsePlan(body) {
  return {
    name: requireStr(body.name, 'Name'),
    durationMinutes: toNumber(body.durationMinutes, 'Duration', { min: 5, max: 1440, integer: true }),
    price: toNumber(body.price, 'Price', { min: 0, max: 100000 }),
    overtimeRatePerMin: toNumber(body.overtimeRatePerMin, 'Overtime rate', { min: 0, max: 1000 }),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

router.use(protect, active);

// Students see active plans only; admins see all.
router.get(
  '/',
  ah(async (req, res) => {
    const snap = await plans.get();
    let list = snap.docs.map(toObj).sort((a, b) => a.durationMinutes - b.durationMinutes);
    if (req.user.role !== 'admin') list = list.filter((p) => p.isActive);
    res.json(list);
  })
);

router.post(
  '/',
  adminOnly,
  ah(async (req, res) => {
    const data = { ...parsePlan(req.body), createdAt: nowISO() };
    const ref = await plans.add(data);
    res.status(201).json({ id: ref.id, ...data });
  })
);

router.put(
  '/:id',
  adminOnly,
  ah(async (req, res) => {
    const ref = plans.doc(req.params.id);
    if (!(await ref.get()).exists) throw new HttpError(404, 'Plan not found');
    await ref.update(parsePlan(req.body));
    res.json({ id: ref.id, ...(await ref.get()).data() });
  })
);

// Rides keep a snapshot of plan details, so deleting a plan is safe.
router.delete(
  '/:id',
  adminOnly,
  ah(async (req, res) => {
    const ref = plans.doc(req.params.id);
    if (!(await ref.get()).exists) throw new HttpError(404, 'Plan not found');
    await ref.delete();
    res.json({ message: 'Plan deleted' });
  })
);

module.exports = router;
