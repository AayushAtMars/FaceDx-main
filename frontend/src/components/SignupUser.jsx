import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BiometricAuth from './BiometricAuth';

const webcamConfig = {
  width: 720,
  height: 480,
  facingMode: "user",
};

const SignupUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aadharNumber: '',
    password: '',
    emergencyContact: '',
    bloodGroup: '',
    allergies: '',
    pastSurgery: '',
    otherMedicalConditions: '',
    photo: null,
  });
  const [useCamera, setUseCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const handleCapture = () => {
    if (!webcamRef.current) {
      toast.error("Camera not initialized");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Failed to capture image. Please make sure camera permissions are granted.");
      return;
    }

    setCapturedImage(imageSrc);
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        setFormData((prevData) => ({
          ...prevData,
          photo: new File([blob], 'captured.png', { type: 'image/png' }),
        }));
      })
      .catch((error) => {
        console.error("Error processing captured image:", error);
        toast.error("Failed to process captured image. Please try again.");
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      photo: e.target.files[0],
    }));
    setCapturedImage(null);
  };

  const handleBiometricSuccess = async (credential) => {
    setBiometricRegistered(true);
    setFormData((prevData) => ({
      ...prevData,
      fingerprintData: {
        publicKey: credential.publicKey,
        credentialId: credential.id,
      },
    }));
    setShowBiometric(false);
    toast.success("Biometric registered successfully!");
  };

  const handleBiometricError = (error) => {
    console.error('Biometric registration failed:', error);
    toast.error('Failed to register biometric data. You can try again or skip it.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['name', 'email', 'aadharNumber', 'password'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.warning(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!/^\d{12}$/.test(formData.aadharNumber)) {
      toast.error('Aadhar number must be 12 digits');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'fingerprintData' && formData[key]) {
          formDataObj.append(key, JSON.stringify(formData[key]));
        } else if (key === 'photo' && formData[key]) {
          formDataObj.append('photo', formData[key]);
        } else if (formData[key]) {
          formDataObj.append(key, formData[key]);
        }
      });

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/register-user`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Registration successful:', response.data);
      toast.success('Registration successful! Please log in.', {
        autoClose: 2000,
        onClose: () => {
          setTimeout(() => {
            navigate('/login');
          }, 500);
        }
      });
    } catch (error) {
      console.error('Error signing up:', error.response || error);
      toast.error('Signup failed: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-teal-100 to-teal-200 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

      <motion.form
        className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md"
        onSubmit={handleSubmit}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <motion.h2
          className="text-3xl mb-8 text-center text-teal-900 font-extrabold tracking-wide"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Signup as User
        </motion.h2>

        {[ 
          { label: 'Name', name: 'name', type: 'text', required: true },
          { label: 'Email', name: 'email', type: 'email', required: true },
          { label: 'Aadhaar Number', name: 'aadharNumber', type: 'text', required: true },
          { label: 'Password', name: 'password', type: 'password', required: true },
          { label: 'Emergency Contact', name: 'emergencyContact', type: 'text' },
          { label: 'Blood Group', name: 'bloodGroup', type: 'text' },
          { label: 'Allergies', name: 'allergies', type: 'text' },
          { label: 'Past Surgery', name: 'pastSurgery', type: 'text' },
          { label: 'Other Medical Conditions', name: 'otherMedicalConditions', type: 'text' },
        ].map(({ label, name, type }) => (
          <motion.div
            className="mb-6"
            key={name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-teal-700 mb-2">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-gray-800 placeholder-teal-400
                focus:border-teal-600 focus:ring-2 focus:ring-teal-400 focus:outline-none transition duration-300"
            />
          </motion.div>
        ))}

        {/* Photo Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-teal-700 mb-3">Photo</label>
          {useCamera ? (
            <div className="space-y-5">
              {!capturedImage ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    videoConstraints={webcamConfig}
                    className="w-full rounded-xl border border-teal-300 shadow-lg"
                    onUserMediaError={(error) => {
                      console.error("Webcam error:", error);
                      toast.error("Failed to access camera. Please make sure camera permissions are granted.");
                      setUseCamera(false);
                    }}
                  />
                  <div className="flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-teal-700 transition"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCamera(false);
                        setCapturedImage(null);
                      }}
                      className="flex-1 bg-gray-500 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={capturedImage} alt="Captured" className="w-full rounded-xl border border-teal-300 shadow-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setFormData(prev => ({ ...prev, photo: null }));
                    }}
                    className="mt-3 w-full bg-red-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-red-700 transition"
                  >
                    Retake
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setUseCamera(true)}
                className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-teal-700 transition"
              >
                Use Camera
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-teal-700
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-100 file:text-teal-800
                  hover:file:bg-teal-200
                  transition"
              />
              {formData.photo && !capturedImage && (
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Selected"
                  className="w-full rounded-xl border border-teal-300 shadow-lg mt-3"
                />
              )}
            </div>
          )}
        </motion.div>

        {/* Biometric Registration */}
        {!biometricRegistered && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {!showBiometric ? (
              <button
                type="button"
                onClick={() => setShowBiometric(true)}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-indigo-700 transition"
              >
                Register Biometric (Fingerprint)
              </button>
            ) : (
              <BiometricAuth
                onSuccess={handleBiometricSuccess}
                onError={handleBiometricError}
                onCancel={() => setShowBiometric(false)}
              />
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-extrabold tracking-wide
              text-white
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950'}
              transition-colors duration-300`}
          >
            {loading ? 'Signing up...' : 'Signup'}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default SignupUser;
