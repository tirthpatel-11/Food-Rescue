const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const dashboardRoutes = require('./routes/dashboardRoutes');
const donorRoutes = require('./routes/donorRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const foodItemRoutes = require('./routes/foodItemRoutes');
const donationRoutes = require('./routes/donationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const storageRoutes = require('./routes/storageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/storage-units', storageRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`  Food Rescue Network Backend API Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`==================================================`);
  await testConnection();
});
