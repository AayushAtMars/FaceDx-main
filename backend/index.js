// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Professional = require('./models/Professional');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image });
const axios = require('axios');
const fs = require('fs').promises;
const mongoose = require('mongoose');

// Import routes
const chatbotRoutes = require('./routes/chatbot');
const medicalRecordsRouter = require('./routes/medical-records');
const userRouter = require('./routes/user');
const professionalRouter = require('./routes/professional');

const app = express();

// Configure CORS
app.use(cors({
    origin: ['https://face-dx.vercel.app', 'https://face-dx-main.vercel.app', 'https://facedx-main.vercel.app', process.env.CORS_ORIGIN].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files - this should be before other routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Use routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/user', userRouter);
app.use('/api/professional', professionalRouter);
app.use('/api', require('./routes/auth')); // Mount auth routes at /api
// Removed duplicate medical records route mounting

// Load face-api models
const loadModels = async () => {
    const modelPath = path.join(__dirname, 'models');
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log('Face detection models loaded');
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    await mongoose.connect(process.env.MONGO_DB_URL, mongoOptions);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

// Register User
app.post('/api/register-user', upload.single('photo'), async (req, res) => {
    try {
        console.log('Starting user registration...');
        console.log('Received form data:', {
            ...req.body,
            photo: req.file ? 'Photo received' : 'No photo'
        });

        const {
            name,
            email,
            password,
            aadharNumber,
            emergencyContact,
            bloodGroup,
            allergies,
            pastSurgery,
            otherMedicalConditions
        } = req.body;

        // Validate required fields
        const requiredFields = {
            name,
            email,
            password,
            aadharNumber,
            emergencyContact,
            bloodGroup
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                message: 'Please provide all required fields',
                missingFields
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { aadharNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 
                    'Email already registered' : 
                    'Aadhaar number already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Validate and process photo
        let photoData = null;
        if (req.file) {
            console.log('Photo received:', {
                size: req.file.size,
                mimetype: req.file.mimetype,
                bufferLength: req.file.buffer.length
            });

            // Basic image validation
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({
                    message: 'Please upload a valid image file'
                });
            }

            if (req.file.buffer.length > 10 * 1024 * 1024) { // 10MB limit
                return res.status(400).json({
                    message: 'Photo size should be less than 10MB'
                });
            }

            photoData = req.file.buffer;
        }

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            aadharNumber,
            emergencyContact,
            bloodGroup,
            allergies: allergies || 'None',
            pastSurgery: pastSurgery || 'None',
            otherMedicalConditions: otherMedicalConditions || 'None',
            photo: photoData
        });

        // Save user to database
        await user.save();
        console.log('User registered successfully:', {
            id: user._id,
            name: user.name,
            email: user.email,
            hasPhoto: !!user.photo,
            photoSize: user.photo ? user.photo.length : 0
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message
        });
    }
});

// Register Professional
app.post('/professional/register', async (req, res) => {
    try {
        const { name, contact, doctorId, hospital, specialization, password, biometricData } = req.body;
        console.log('Professional registration attempt:', { name, doctorId, contact, hospital, specialization });

        // Validate all required fields
        const requiredFields = { name, contact, doctorId, hospital, specialization, password };
        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const existingProfessional = await Professional.findOne({ doctorId });
        if (existingProfessional) {
            return res.status(400).json({ message: 'A professional with this Doctor ID already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newProfessional = new Professional({
            name,
            contact,
            doctorId,
            hospital,
            specialization,
            password: hashedPassword,
            biometricData: biometricData || null
        });
        
        await newProfessional.save();
        console.log('Professional registered successfully:', { name, doctorId });
        
        res.status(201).json({
            message: 'Medical professional registered successfully',
            professional: {
                name: newProfessional.name,
                doctorId: newProfessional.doctorId,
                contact: newProfessional.contact,
                hospital: newProfessional.hospital,
                specialization: newProfessional.specialization
            }
        });
    } catch (error) {
        console.error('Error registering professional:', error);
        res.status(500).json({
            message: 'Error registering professional',
            error: error.message
        });
    }
});

// User login route
app.post('/login-user', async (req, res) => {
    try {
        const { id, password } = req.body;
        
        if (!id || !password) {
            return res.status(400).json({ message: 'Please provide both ID and password' });
        }

        const user = await User.findOne({ aadharNumber: id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        const userResponse = { ...user.toObject() };
        delete userResponse.password;
        delete userResponse.fingerprintData;

        res.json({ token, user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Professional login route
app.post('/login-professional', async (req, res) => {
    try {
        const { id, password } = req.body;
        
        if (!id || !password) {
            return res.status(400).json({ message: 'Please provide both ID and password' });
        }

        const professional = await Professional.findOne({ doctorId: id });
        if (!professional) {
            return res.status(404).json({ message: 'Medical Professional not found' });
        }

        const isMatch = await bcrypt.compare(password, professional.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: professional._id, role: 'professional' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        const professionalResponse = { ...professional.toObject() };
        delete professionalResponse.password;
        delete professionalResponse.fingerprintData;

        res.json({ token, user: professionalResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { role, password } = req.body;
        const identifier = role === 'professional' ? req.body.doctorId : req.body.aadharNumber;

        if (!identifier || !password || !role) {
            return res.status(400).json({ 
                message: 'Please provide all required fields',
                details: {
                    identifier: !identifier,
                    password: !password,
                    role: !role
                }
            });
        }

        // Find user/professional
        const Model = role === 'professional' ? Professional : User;
        const searchField = role === 'professional' ? 'doctorId' : 'aadharNumber';
        
        console.log('Looking for user with:', { role, identifier, searchField });
        const user = await Model.findOne({ [searchField]: identifier });

        if (!user) {
            console.log('User not found for:', { role, identifier });
            return res.status(404).json({ 
                message: role === 'professional' 
                    ? 'No professional found with this Doctor ID' 
                    : 'No user found with this Aadhar number' 
            });
        }

        console.log('User found:', { id: user._id, role });
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ message: 'Invalid password' });
        }

        console.log('Password verified, generating token');
        // Create and assign token with proper user ID
        const tokenPayload = {
            userId: user._id.toString(), // Ensure it's a string
            role: role,
            identifier: identifier
        };
        console.log('Token payload:', tokenPayload);

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        const userResponse = { ...user.toObject() };
        delete userResponse.password;

        console.log('Login successful for:', { role, identifier });
        res.json({ 
            token, 
            user: userResponse,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: error.message 
        });
    }
});

// Biometric login route
app.post('/biometric-login', async (req, res) => {
    try {
        const { credentialId, role } = req.body;

        if (!credentialId || !role) {
            return res.status(400).json({ message: 'Credential ID and role are required' });
        }

        let user;
        if (role === 'user') {
            user = await User.findOne({ 'fingerprintData.credentialId': credentialId });
        } else {
            user = await Professional.findOne({ 'fingerprintData.credentialId': credentialId });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove sensitive data before sending response
        const userResponse = { ...user.toObject() };
        delete userResponse.password;
        delete userResponse.fingerprintData;

        res.json({ token, user: userResponse });
    } catch (error) {
        console.error('Biometric login error:', error);
        res.status(500).json({ message: 'Error during biometric login' });
    }
});

// Function to authenticate JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is malformed' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Function to authorize role
function authorize(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Access denied: incorrect role' });
        }
        next();
    };
}

// GET /userData endpoint (User login and get data)
app.get('/userData', authenticateJWT, async (req, res) => {
    try {
        console.log('Fetching user data for:', req.user);
        const Model = req.user.role === 'professional' ? Professional : User;
        const user = await Model.findById(req.user.id);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive data
        const userData = user.toObject();
        delete userData.password;

        console.log('User data fetched successfully');
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

// POST /update endpoint (User data update)
app.post('/update', authenticateJWT, authorize('user'), upload.single('photo'), async (req, res) => {
    try {
        const { emergencyContact, bloodGroup, allergies, pastSurgery, otherMedicalConditions } = req.body;
        const updateFields = {
            emergencyContact,
            bloodGroup,
            allergies,
            pastSurgery,
            otherMedicalConditions
        };
        if (req.file) updateFields.photo = req.file.buffer;

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true });
        res.status(200).send('User data updated successfully');
    } catch (error) {
        res.status(500).send('Error updating user data: ' + error.message);
    }
});

// Update user photo endpoint
app.post('/update-photo', authenticateJWT, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No photo provided' });
        }

        const Model = req.user.role === 'professional' ? Professional : User;
        const user = await Model.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.photo = req.file.buffer;
        await user.save();

        res.json({ 
            message: 'Photo updated successfully',
            photo: req.file.buffer.toString('base64')
        });
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ message: 'Error updating photo' });
    }
});

// Configure express timeout
app.use((req, res, next) => {
  // Set timeout to 2 minutes
  req.setTimeout(120000);
  next();
});

// POST /verify endpoint (Restricted to medical professionals)
app.post('/verify', authenticateJWT, authorize('professional'), upload.single('photo'), async (req, res) => {
    try {
        console.log('Starting verification process...');
        
        if (!req.file || !req.file.buffer) {
            console.error('No file uploaded');
            return res.status(400).json({ 
                message: 'No photo provided or invalid file.',
                details: 'Please ensure you have uploaded a valid image file.'
            });
        }

        console.log('Photo received, size:', req.file.buffer.length, 'bytes');

        // Image quality checks
        const buffer = req.file.buffer;
        const fileSize = buffer.length;
        if (fileSize > 10 * 1024 * 1024) {
            console.error('File too large:', fileSize, 'bytes');
            return res.status(400).json({ 
                message: 'Image file too large',
                details: 'Please upload an image smaller than 10MB'
            });
        }

        // Load and process the uploaded image
        console.log('Loading image...');
        const img = await canvas.loadImage(Buffer.from(buffer));
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Detect faces in the uploaded image using TinyFaceDetector
        console.log('Detecting face...');
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.3
        }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

        if (!detection) {
            console.error('No face detected in image');
            return res.status(400).json({ 
                message: 'No face detected in the image',
                details: 'Please ensure the face is clearly visible and well-lit'
            });
        }

        console.log('Face detected successfully');

        // Find all users with photos
        const users = await User.find({ photo: { $exists: true, $ne: null } });
        console.log('Found users:', users.map(user => ({
            id: user._id,
            name: user.name,
            hasPhoto: !!user.photo,
            photoSize: user.photo ? user.photo.length : 0
        })));
        
        if (users.length === 0) {
            console.error('No users found in database with photos');
            return res.status(404).json({ 
                message: 'No registered users found',
                details: 'No users with registered photos in the database'
            });
        }

        let bestMatch = null;
        let minDistance = Infinity;

        // Process users in smaller batches
        const batchSize = 5;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(users.length/batchSize)}`);
            
            // Process batch in parallel
            const results = await Promise.all(batch.map(async (user) => {
                try {
                    if (!user.photo) {
                        console.log(`User ${user._id} has no photo`);
                        return null;
                    }

                    console.log(`Processing user ${user._id}'s photo...`);
                    const userImg = await canvas.loadImage(Buffer.from(user.photo));
                    console.log(`User photo loaded, dimensions: ${userImg.width}x${userImg.height}`);
                    
                    const userDetection = await faceapi.detectSingleFace(userImg, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 416,
                        scoreThreshold: 0.3
                    }))
                    .withFaceLandmarks(true)
                    .withFaceDescriptor();

                    if (!userDetection) {
                        console.log(`No face detected in user ${user._id}'s photo`);
                        return null;
                    }

                    const distance = faceapi.euclideanDistance(detection.descriptor, userDetection.descriptor);
                    console.log(`Distance for user ${user._id}:`, distance);
                    return { user, distance };
                } catch (err) {
                    console.error(`Error processing user ${user._id}'s photo:`, err);
                    return null;
                }
            }));

            // Find best match in batch
            results.forEach(result => {
                if (result && result.distance < minDistance) {
                    console.log(`New best match found: ${result.user._id} with distance ${result.distance}`);
                    minDistance = result.distance;
                    bestMatch = result.user;
                }
            });
        }

        // Threshold for face matching (0.6 is a good default)
        const MATCH_THRESHOLD = 0.6;
        console.log('Best match distance:', minDistance, 'Threshold:', MATCH_THRESHOLD);
        
        if (!bestMatch || minDistance > MATCH_THRESHOLD) {
            console.log('No match found or distance above threshold');
            return res.status(404).json({ 
                message: 'No matching user found',
                details: 'Could not find a matching face in our database'
            });
        }

        // Calculate confidence score (convert distance to percentage)
        const confidence = ((1 - minDistance) * 100).toFixed(2);
        console.log('Match found with confidence:', confidence + '%');

        // Return matched user data
        const userData = {
            name: bestMatch.name,
            aadharNumber: bestMatch.aadharNumber,
            emergencyContact: bestMatch.emergencyContact,
            bloodGroup: bestMatch.bloodGroup,
            allergies: bestMatch.allergies || 'None',
            pastSurgery: bestMatch.pastSurgery || 'None',
            otherMedicalConditions: bestMatch.otherMedicalConditions || 'None',
            photo: bestMatch.photo ? bestMatch.photo.toString('base64') : null
        };

        console.log('Returning user data:', {
            ...userData,
            photo: userData.photo ? 'Photo data present' : 'No photo'
        });
        
        res.json({ 
            message: 'Match found',
            ...userData,
            confidence: confidence + '%'
        });

    } catch (error) {
        console.error('Face verification error:', error);
        res.status(500).json({ 
            message: 'Error during face verification',
            details: error.message || 'An unexpected error occurred during verification'
        });
    }
});

// Test route to verify server is running
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Catch-all route handler for undefined routes
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.url);
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// Check database content
app.get('/check-users', async (req, res) => {
    try {
        const users = await User.find({});
        const usersWithPhotos = users.filter(user => user.photo);
        
        console.log('Total users:', users.length);
        console.log('Users with photos:', usersWithPhotos.length);
        
        const userDetails = users.map(user => ({
            id: user._id,
            name: user.name,
            hasPhoto: !!user.photo,
            photoSize: user.photo ? user.photo.length : 0
        }));
        
        res.json({
            totalUsers: users.length,
            usersWithPhotos: usersWithPhotos.length,
            details: userDetails
        });
    } catch (error) {
        console.error('Error checking users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'File size too large. Maximum size is 5MB.',
        error: err.message
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

// Initialize models before starting server
const initializeServer = async () => {
  try {
    await loadModels();
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

initializeServer();