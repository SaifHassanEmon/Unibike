/**
 * Seeds Firestore with an admin account, stations, bikes and pricing plans.
 * Safe to run multiple times: existing data is not duplicated.
 *   npm run seed
 */
require('dotenv').config();
const { admin, db } = require('./firebase');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@unibike.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const STATIONS = [
  { name: 'Main Gate', location: 'Near the university main entrance', lat: 23.7286, lng: 90.3925, capacity: 12 },
  { name: 'Central Library', location: 'In front of the library', lat: 23.7302, lng: 90.3948, capacity: 10 },
  { name: 'Science Building', location: 'East side parking', lat: 23.7311, lng: 90.3972, capacity: 8 },
  { name: 'Student Hall', location: 'Beside the residential halls', lat: 23.7268, lng: 90.3961, capacity: 10 },
  { name: 'Cafeteria', location: 'Central cafeteria courtyard', lat: 23.7295, lng: 90.3936, capacity: 8 },
];

const PLANS = [
  { name: 'Quick Ride', durationMinutes: 30, price: 20, overtimeRatePerMin: 1, isActive: true },
  { name: 'One Hour', durationMinutes: 60, price: 35, overtimeRatePerMin: 1, isActive: true },
  { name: 'Two Hours', durationMinutes: 120, price: 60, overtimeRatePerMin: 0.75, isActive: true },
  { name: 'Half Day', durationMinutes: 240, price: 100, overtimeRatePerMin: 0.5, isActive: true },
];

const MODELS = ['Campus Cruiser', 'City Lite', 'Urban Pro'];

async function seedAdmin() {
  let user;
  try {
    user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log(`Admin auth user exists: ${ADMIN_EMAIL}`);
  } catch {
    user = await admin.auth().createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: 'Administrator' });
    console.log(`Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
  await db.collection('users').doc(user.uid).set(
    {
      name: 'Administrator',
      studentId: 'ADMIN',
      email: ADMIN_EMAIL,
      role: 'admin',
      walletBalance: 0,
      isBlocked: false,
      activeRideId: null,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function seedCollection(name, items) {
  const existing = await db.collection(name).limit(1).get();
  if (!existing.empty) {
    console.log(`"${name}" already has data, skipping`);
    return null;
  }
  const batch = db.batch();
  const ids = items.map((item) => {
    const ref = db.collection(name).doc();
    batch.set(ref, { ...item, createdAt: new Date().toISOString() });
    return ref.id;
  });
  await batch.commit();
  console.log(`Seeded ${items.length} ${name}`);
  return ids;
}

(async () => {
  await seedAdmin();
  const stationIds = await seedCollection('stations', STATIONS);
  await seedCollection('plans', PLANS);

  if (stationIds) {
    const bikes = [];
    let n = 1;
    stationIds.forEach((sid, i) => {
      const count = Math.max(3, Math.floor(STATIONS[i].capacity * 0.6));
      for (let k = 0; k < count; k++) {
        bikes.push({
          bikeCode: `UB-${String(n++).padStart(3, '0')}`,
          model: MODELS[n % MODELS.length],
          status: k === count - 1 && i % 2 === 0 ? 'maintenance' : 'available',
          currentStation: sid,
        });
      }
    });
    await seedCollection('bikes', bikes);
  }
  console.log('Seeding done.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
