const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
