const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Register User
router.post('/register-user', upload.single('photo'), async (req, res) => {
  try {
    const {
      name,
      email,
      aadharNumber,
      password,
      emergencyContact,
      bloodGroup,
      allergies,
      pastSurgery,
      otherMedicalConditions,
      biometricData
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ aadharNumber }, { email }] });
    if (existingUser) {
      return res.status(400).json('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      aadharNumber,
      password: hashedPassword,
      emergencyContact,
      bloodGroup,
      allergies,
      pastSurgery,
      otherMedicalConditions,
      photo: req.file ? req.file.buffer : null,
      biometricData: biometricData || null
    });

    await user.save();
    res.status(201).json('User registered successfully');
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json('Server error');
  }
});

// Register Professional
router.post('/register-professional', async (req, res) => {
  try {
    const {
      name,
      doctorId,
      password,
      contact,
      affiliatedHospital,
      biometricData
    } = req.body;

    // Check if professional already exists
    const existingProfessional = await Professional.findOne({ doctorId });
    if (existingProfessional) {
      return res.status(400).json('Professional already exists');
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
      affiliatedHospital,
      biometricData: biometricData || null
    });

    await professional.save();
    res.status(201).json('Professional registered successfully');
  } catch (error) {
    console.error('Error in professional registration:', error);
    res.status(500).json('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { role, password, biometricData } = req.body;
    const identifier = role === 'professional' ? req.body.doctorId : req.body.aadharNumber;

    // Find user/professional
    const Model = role === 'professional' ? Professional : User;
    const user = await Model.findOne({
      [role === 'professional' ? 'doctorId' : 'aadharNumber']: identifier
    });

    if (!user) {
      return res.status(400).json('Invalid credentials');
    }

    // If biometric data is provided, verify it
    if (biometricData) {
      if (!user.biometricData) {
        return res.status(400).json('Biometric authentication not set up');
      }

      // In a real application, you would verify the biometric data here
      // For this example, we'll just check if it exists
      console.log('Biometric authentication successful');
    } else {
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json('Invalid credentials');
      }
    }

    // Create and assign token
    const token = jwt.sign(
      { 
        id: user._id,
        role,
        [role === 'professional' ? 'doctorId' : 'aadharNumber']: identifier
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json('Server error');
  }
});

module.exports = router;
