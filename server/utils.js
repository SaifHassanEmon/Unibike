class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wraps async route handlers so thrown errors reach the error middleware. */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Converts a Firestore document snapshot into a plain object with id. */
const toObj = (doc) => ({ id: doc.id, ...doc.data() });

const nowISO = () => new Date().toISOString();

const byDateDesc = (field) => (a, b) => (b[field] || '').localeCompare(a[field] || '');

const toNumber = (v, name, { min = -Infinity, max = Infinity, integer = false } = {}) => {
  const n = Number(v);
  if (v === '' || v === null || v === undefined || Number.isNaN(n)) {
    throw new HttpError(400, `${name} must be a number`);
  }
  if (integer && !Number.isInteger(n)) throw new HttpError(400, `${name} must be a whole number`);
  if (n < min || n > max) throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  return n;
};

const requireStr = (v, name) => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${name} is required`);
  return v.trim();
};

module.exports = { HttpError, ah, toObj, nowISO, byDateDesc, toNumber, requireStr };
