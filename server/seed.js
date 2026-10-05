/**
 * Seeds Firestore with an admin account, stations, bikes and pricing plans.
 * Coordinates updated for Daffodil International University (DSC Ashulia).
 */
require('dotenv').config();
const { admin, db } = require('./firebase');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@unibike.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const STATIONS = [
  {
    name: 'DIU Main Gate & Transport',
    location: 'Near Ashulia main highway entrance & bus terminal',
    lat: 23.8760,
    lng: 90.3205,
    capacity: 15
  },
  {
    name: 'Knowledge Tower (AB-4)',
    location: 'East side bicycle port, Academic Building 4',
    lat: 23.8795,
    lng: 90.3220,
    capacity: 14
  },
  {
    name: 'Engineering Complex',
    location: 'Front plaza of Engineering & CSE Faculty block',
    lat: 23.8805,
    lng: 90.3235,
    capacity: 12
  },
  {
    name: 'Central Library & Yunus Centre',
    location: 'Academic lawn opposite central library',
    lat: 23.8787,
    lng: 90.3213,
    capacity: 10
  },
  {
    name: 'Food Court & Student Village',
    location: 'Near DSC central food village courtyard',
    lat: 23.8778,
    lng: 90.3229,
    capacity: 12
  },
  {
    name: 'Yabushita Sports Complex',
    location: 'Beside basketball courts and stadium pavilion',
    lat: 23.8765,
    lng: 90.3242,
    capacity: 10
  },
  {
    name: 'Student Residential Halls',
    location: 'Dormitory gates and hostel perimeter',
    lat: 23.8820,
    lng: 90.3248,
    capacity: 12
  },
];

const PLANS = [
  { name: 'Quick Campus Ride', durationMinutes: 30, price: 15, overtimeRatePerMin: 1, isActive: true },
  { name: 'One Hour Pass', durationMinutes: 60, price: 25, overtimeRatePerMin: 1, isActive: true },
  { name: 'Class Block (2 Hours)', durationMinutes: 120, price: 45, overtimeRatePerMin: 0.75, isActive: true },
  { name: 'Full Campus Day Pass', durationMinutes: 360, price: 80, overtimeRatePerMin: 0.5, isActive: true },
];

const MODELS = ['Campus Cruiser', 'City Lite', 'Urban Pro', 'DIU EcoRide'];

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

async function updateOrSeedStations() {
  const existing = await db.collection('stations').get();
  const batch = db.batch();

  if (existing.empty) {
    console.log('Seeding new DIU stations...');
    const stationIds = [];
    STATIONS.forEach((st) => {
      const ref = db.collection('stations').doc();
      batch.set(ref, { ...st, createdAt: new Date().toISOString() });
      stationIds.push(ref.id);
    });
    await batch.commit();
    return stationIds;
  }

  // If stations exist, update their coordinates to DIU campus locations
  console.log(`Updating ${existing.size} existing stations to DIU campus coordinates...`);
  existing.docs.forEach((doc, idx) => {
    const diuTarget = STATIONS[idx % STATIONS.length];
    batch.update(doc.ref, {
      name: diuTarget.name,
      location: diuTarget.location,
      lat: diuTarget.lat,
      lng: diuTarget.lng,
    });
  });
  await batch.commit();
  return existing.docs.map((d) => d.id);
}

(async () => {
  await seedAdmin();
  const stationIds = await updateOrSeedStations();

  const plansSnap = await db.collection('plans').limit(1).get();
  if (plansSnap.empty) {
    const batch = db.batch();
    PLANS.forEach((p) => {
      const ref = db.collection('plans').doc();
      batch.set(ref, { ...p, createdAt: new Date().toISOString() });
    });
    await batch.commit();
    console.log('Seeded plans');
  }

  const bikesSnap = await db.collection('bikes').limit(1).get();
  if (bikesSnap.empty && stationIds) {
    const bikes = [];
    let n = 1;
    stationIds.forEach((sid, i) => {
      const count = 4;
      for (let k = 0; k < count; k++) {
        bikes.push({
          bikeCode: `UB-${String(n++).padStart(3, '0')}`,
          model: MODELS[n % MODELS.length],
          status: k === count - 1 && i % 2 === 0 ? 'maintenance' : 'available',
          currentStation: sid,
          createdAt: new Date().toISOString(),
        });
      }
    });
    const batch = db.batch();
    bikes.forEach((b) => batch.set(db.collection('bikes').doc(), b));
    await batch.commit();
    console.log(`Seeded ${bikes.length} bikes`);
  }

  console.log('DIU Campus seeding & update done.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
