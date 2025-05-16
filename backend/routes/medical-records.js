const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/medical-records');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  if (file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/png' || 
      file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Medical Record Schema
const medicalRecordSchema = new mongoose.Schema({
  aadharNumber: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedByType: { type: String, enum: ['user', 'professional'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileType: String,
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

// Upload medical record
router.post('/api/medical-records/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    console.log('Received upload request:', req.body);
    const { aadharNumber, uploadedBy, uploadedByType, title, description } = req.body;
    
    if (!aadharNumber) {
      return res.status(400).json({ message: 'No Aadhar number provided' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname);

    const medicalRecord = new MedicalRecord({
      aadharNumber,
      uploadedBy,
      uploadedByType,
      title,
      description,
      filePath,
      fileType,
    });

    await medicalRecord.save();
    console.log('Medical record saved successfully:', medicalRecord);
    res.status(201).json({ message: 'Medical record uploaded successfully' });
  } catch (error) {
    console.error('Error uploading medical record:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Missing required fields', error: error.message });
    }
    res.status(500).json({ message: 'Error uploading medical record', error: error.message });
  }
});

// Get medical records by aadharNumber
router.get('/api/medical-records/aadhar/:aadharNumber', authenticateJWT, async (req, res) => {
  try {
    console.log('Fetching records for Aadhar:', req.params.aadharNumber);
    const { aadharNumber } = req.params;
    if (!aadharNumber) {
      return res.status(400).json({ message: 'Aadhar number is required' });
    }

    const records = await MedicalRecord.find({ aadharNumber })
      .sort({ uploadDate: -1 });

    console.log('Found records:', records.length);

    // Transform the records to include the file URL
    const transformedRecords = records.map(record => ({
      _id: record._id,
      aadharNumber: record.aadharNumber,
      uploadedBy: record.uploadedBy,
      uploadedByType: record.uploadedByType,
      title: record.title,
      description: record.description,
      uploadDate: record.uploadDate,
      fileType: record.fileType,
      fileUrl: `/uploads/medical-records/${path.basename(record.filePath)}`
    }));

    res.json(transformedRecords);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ message: 'Error fetching medical records', error: error.message });
  }
});

// Serve uploaded files
router.get('/uploads/medical-records/:filename', authenticateJWT, (req, res) => {
  const filePath = path.join(__dirname, '../uploads/medical-records', req.params.filename);
  res.sendFile(filePath);
});

// Download/view medical record
router.get('/api/medical-records/download/:recordId', authenticateJWT, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.download(record.filePath);
  } catch (error) {
    console.error('Error downloading medical record:', error);
    res.status(500).json({ error: 'Error downloading medical record' });
  }
});

module.exports = router;
