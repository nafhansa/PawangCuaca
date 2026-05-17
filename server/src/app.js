require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { testConnection } = require('./db/pool');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const weatherRoutes = require('./routes/weather');
const votesRoutes = require('./routes/votes');
const locationsRoutes = require('./routes/locations');

const app = express();

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.open-meteo.com", "https://nominatim.openstreetmap.org"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Voter-Hash'],
  optionsSuccessStatus: 200,
}));

if (process.env.TRUSTED_PROXIES) {
  app.set('trust proxy', parseInt(process.env.TRUSTED_PROXIES, 10));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(globalLimiter);

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbConnected ? 'connected' : 'disconnected',
    cache: 'active',
    uptime_seconds: process.uptime(),
  });
});

app.use('/api/weather', weatherRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/locations', locationsRoutes);

app.use(errorHandler);

testConnection();

module.exports = app;
