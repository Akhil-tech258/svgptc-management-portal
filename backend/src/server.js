const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const seed = require('./config/seed');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const clerkRoutes = require('./routes/clerkRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const branchRoutes = require('./routes/branchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allows GitHub Pages and local development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/clerk', clerkRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/branches', branchRoutes);

// Serve frontend statically with zero cache so updates reflect immediately
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath, {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// 404 handler for unknown frontend routes
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(frontendPath, '404.html'));
  } else {
    res.status(404).json({
      success: false,
      error: `Resource '${req.originalUrl}' not found.`
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Initialize DB and start server
async function startServer() {
  try {
    await db.initDB();
    await seed();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  Student No-Dues & TC Generator Backend API`);
      console.log(`  Running on: http://localhost:${PORT} (0.0.0.0:${PORT})`);
      console.log(`  Database:   PostgreSQL`);
      console.log(`====================================================`);
    });

  } catch (err) {
    console.error('Failed to initialize and start server:', err);
    process.exit(1);
  }
}

startServer();
