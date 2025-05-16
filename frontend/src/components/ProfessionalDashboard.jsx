import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { FaSpinner } from 'react-icons/fa';
import MedicalRecords from './MedicalRecords';

const ProfessionalDashboard = () => {
  const [photo, setPhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [professionalData, setProfessionalData] = useState(null);
  const [scanningStatus, setScanningStatus] = useState('idle'); // 'idle', 'scanning', 'processing', 'error', 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const webcamConfig = {
    width: 640,
    height: 480,
    facingMode: "user",
    imageSmoothing: true,
    screenshotQuality: 1,
  };

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          navigate('/login');
          return;
        }

        console.log('Fetching professional data...');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/professional/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Professional data received:', response.data);
        setProfessionalData(response.data);
        if (response.data.photo) {
          console.log('Setting profile photo');
          setProfilePhoto(`data:image/jpeg;base64,${response.data.photo}`);
        }
      } catch (error) {
        console.error('Error fetching professional data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.message || 'Failed to fetch professional data';
          setErrorMessage(errorMessage);
        }
      }
    };

    fetchProfessionalData();
  }, [navigate]);

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3001/api/professional/update-photo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.photo) {
          console.log('Setting new profile photo');
          setProfilePhoto(`data:image/jpeg;base64,${response.data.photo}`);
        }
        
      } catch (error) {
        console.error('Error updating profile photo:', error);
        setErrorMessage('Failed to update profile photo');
      }
    }
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
    setCapturedImage(null);
  };

  const handleCapture = () => {
    if (!webcamRef.current) {
      setErrorMessage("Camera not initialized. Please ensure camera permissions are granted.");
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setErrorMessage("Failed to capture image. Please ensure good lighting and try again.");
        return;
      }

      setCapturedImage(imageSrc);
      setScanningStatus('processing');

      // Convert base64 to blob with proper image processing
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const imageFile = new File([blob], "captured.jpg", { 
            type: "image/jpeg",
            lastModified: new Date().getTime()
          });
          setPhoto(imageFile);
          setScanningStatus('idle');
        })
        .catch(error => {
          console.error("Error processing captured image:", error);
          setErrorMessage("Failed to process captured image. Please try again.");
          setScanningStatus('error');
        });
    } catch (error) {
      console.error("Camera capture error:", error);
      setErrorMessage("Failed to access camera. Please check permissions and try again.");
      setScanningStatus('error');
    }
  };

  const handleScan = async () => {
    if (!photo) {
      setErrorMessage('Please upload or capture a photo to scan');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photo);

    try {
      setLoading(true);
      setScanningStatus('scanning');
      setErrorMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Please login again');
        navigate('/login');
        return;
      }

      console.log('Sending scan request...');
      const response = await axios.post('http://localhost:3001/verify', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // Increase timeout to 2 minutes
      });
      
      console.log('Scan response:', response.data);
      if (response.data) {
        setResultData(response.data);
        setScanningStatus('success');
      } else {
        setScanningStatus('error');
        setErrorMessage('No data received from scan');
      }
    } catch (error) {
      console.error('Error scanning photo:', error);
      setScanningStatus('error');
      
      if (error.code === 'ECONNABORTED') {
        setErrorMessage('Scan timeout. Please try again with a clearer photo.');
      } else if (error.response?.status === 404) {
        setErrorMessage('No matching user found. Please try again with a clearer photo.');
      } else if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to scan photo. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resultData) {
      console.log('ResultData updated:', resultData);
    }
  }, [resultData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const renderScanningStatus = () => {
    switch (scanningStatus) {
      case 'scanning':
        return (
          <div className="text-center py-4">
            <FaSpinner className="animate-spin text-3xl text-teal-600 mx-auto mb-2" />
            <p className="text-teal-600">Scanning and matching face...</p>
          </div>
        );
      case 'processing':
        return (
          <div className="text-center py-4">
            <FaSpinner className="animate-spin text-3xl text-teal-600 mx-auto mb-2" />
            <p className="text-teal-600">Processing image...</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center py-4">
            <p className="text-red-500">{errorMessage}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center py-4">
            <p className="text-green-500">Scan successful!</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-100 to-teal-200">
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[32rem] max-w-2xl">
          <h1 className="text-2xl mb-6 text-center text-teal-800 font-bold">
            Medical Professional Dashboard
          </h1>

          {/* Professional Info */}
          {professionalData && (
            <div className="mb-6">
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-2">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Photo
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                  id="profile-photo-input"
                />
                <label
                  htmlFor="profile-photo-input"
                  className="bg-teal-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-teal-600 transition-colors"
                >
                  Update Profile Photo
                </label>
              </div>
              <p className="mb-2"><strong>Name:</strong> {professionalData.name}</p>
              <p className="mb-2"><strong>Doctor ID:</strong> {professionalData.doctorId}</p>
              <p className="mb-2"><strong>Contact:</strong> {professionalData.contact}</p>
              <p><strong>Hospital:</strong> {professionalData.hospital || 'Not specified'}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-4">
              <button
                className="bg-teal-600 text-white w-full py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                onClick={() => {
                  setUseCamera(!useCamera);
                  setCapturedImage(null);
                }}
              >
                {useCamera ? 'Switch to Upload' : 'Use Camera'}
              </button>
            </div>

            {useCamera ? (
              <div className="mb-4">
                {!capturedImage ? (
                  <>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={webcamConfig}
                      className="w-full h-auto mb-4 rounded-lg"
                      mirrored={false}
                    />
                    <button
                      className="bg-teal-600 text-white w-full py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                      onClick={handleCapture}
                    >
                      Capture Photo
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-lg" />
                    <div className="flex justify-between gap-4">
                      <button
                        className="bg-teal-600 text-white flex-1 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                        onClick={() => {
                          setCapturedImage(null);
                          setPhoto(null);
                        }}
                      >
                        Retake Photo
                      </button>
                      <button
                        className="bg-gray-600 text-white flex-1 py-2 rounded-lg hover:bg-gray-700 transition duration-300"
                        onClick={() => setUseCamera(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <button
              className="bg-teal-600 text-white w-full py-2 rounded-lg hover:bg-teal-700 transition duration-300 mb-4"
              onClick={handleScan}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Scanning...
                </span>
              ) : (
                'Scan Photo'
              )}
            </button>

            {renderScanningStatus()}

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>{errorMessage}</p>
              </div>
            )}

            {resultData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-4 text-xl text-center text-teal-800">Patient Information</h3>
                
                {/* Patient Photo */}
                <div className="mb-4 text-center">
                  {resultData.photo ? (
                    <img
                      src={`data:image/jpeg;base64,${resultData.photo}`}
                      alt="Patient"
                      className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-teal-500"
                      onError={(e) => {
                        console.error('Error loading patient photo');
                        e.target.src = '';
                        e.target.alt = 'No Photo';
                        e.target.className = 'w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center';
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Patient Details */}
                <div className="space-y-2">
                  <p><strong>Name:</strong> {resultData.name || 'N/A'}</p>
                  <p><strong>Aadhar Number:</strong> {resultData.aadharNumber || 'N/A'}</p>
                  <p><strong>Emergency Contact:</strong> {resultData.emergencyContact || 'N/A'}</p>
                  <p><strong>Blood Group:</strong> {resultData.bloodGroup || 'N/A'}</p>
                  <p><strong>Allergies:</strong> {resultData.allergies || 'None'}</p>
                  <p><strong>Past Surgery:</strong> {resultData.pastSurgery || 'None'}</p>
                  <p><strong>Other Medical Conditions:</strong> {resultData.otherMedicalConditions || 'None'}</p>
                </div>

                {/* Medical Records */}
                <div className="mt-6">
                  {resultData.aadharNumber ? (
                    <MedicalRecords 
                      userId={resultData._id} 
                      isProfessional={true} 
                      aadharNumber={resultData.aadharNumber}
                    />
                  ) : (
                    <div className="text-red-500 p-4 bg-red-50 rounded">
                      Unable to load medical records. Aadhar number not found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white w-full py-2 mt-6 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
