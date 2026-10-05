require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./firebase');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/bikes', require('./routes/bikes'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`UniBike API running on http://localhost:${PORT}`));
