const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Professional = require('../models/Professional');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded.userId || decoded.role !== 'professional') {
      return res.status(401).json({ message: 'Invalid token or unauthorized role' });
    }

    req.userId = decoded.userId;
    req.doctorId = decoded.identifier;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Register Professional
router.post('/register', async (req, res) => {
  try {
    const { name, doctorId, password, contact, hospital, specialization, biometricData } = req.body;

    // Validate required fields
    const requiredFields = { name, doctorId, password, contact, hospital, specialization };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if professional already exists
    const existingProfessional = await Professional.findOne({ doctorId });
    if (existingProfessional) {
      return res.status(400).json({
        message: 'A professional with this Doctor ID already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new professional
    const professional = new Professional({
      name,
      doctorId,
      password: hashedPassword,
      contact,
      hospital,
      specialization,
      biometricData: biometricData || null
    });

    await professional.save();

    res.status(201).json({
      message: 'Professional registered successfully',
      professional: {
        name: professional.name,
        doctorId: professional.doctorId,
        contact: professional.contact,
        hospital: professional.hospital,
        specialization: professional.specialization
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering professional',
      error: error.message
    });
  }
});

// Get professional profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const professional = await Professional.findById(req.userId);
    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    res.json({
      name: professional.name,
      doctorId: professional.doctorId,
      contact: professional.contact,
      hospital: professional.hospital,
      specialization: professional.specialization
    });
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    res.status(500).json({ 
      message: 'Error fetching professional profile',
      error: error.message 
    });
  }
});

module.exports = router;
