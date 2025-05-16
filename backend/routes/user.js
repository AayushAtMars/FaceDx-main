const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    console.log('Decoded token:', decoded);
    
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token format - no userId' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.userId);
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.log('User not found for ID:', req.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', {
      id: user._id,
      name: user.name,
      hasAadhar: !!user.aadharNumber
    });

    // Send back user data without sensitive information
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      aadharNumber: user.aadharNumber,
      emergencyContact: user.emergencyContact,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies || 'None',
      pastSurgery: user.pastSurgery || 'None',
      otherMedicalConditions: user.otherMedicalConditions || 'None',
      photo: user.photo ? user.photo.toString('base64') : null
    });
  } catch (error) {
    console.error('Error in /profile route:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile',
      error: error.message 
    });
  }
});

module.exports = router;
