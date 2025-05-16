import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from 'date-fns';

const MedicalRecords = ({ userId, isProfessional = false, aadharNumber: providedAadharNumber }) => {
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aadharNumber, setAadharNumber] = useState(providedAadharNumber);

  useEffect(() => {
    const initializeComponent = async () => {
      if (!isProfessional && !aadharNumber) {
        // For user dashboard, get aadhar from token
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Please login again.');
            return;
          }

          // First try to get Aadhar from token
          try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            console.log('Decoded token:', decodedToken);
            
            if (decodedToken.aadharNumber) {
              console.log('Found Aadhar in token:', decodedToken.aadharNumber);
              setAadharNumber(decodedToken.aadharNumber);
              setError(null);
              return;
            }
          } catch (e) {
            console.error('Error decoding token:', e);
          }

          // If not in token, fetch from profile
          const response = await axios.get('http://localhost:3001/api/user/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          console.log('Profile response:', response.data);
          if (response.data && response.data.aadharNumber) {
            console.log('Got user Aadhar from profile:', response.data.aadharNumber);
            setAadharNumber(response.data.aadharNumber);
            setError(null);
          } else {
            setError('Could not retrieve Aadhar number from profile');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          const errorMessage = error.response?.data?.message || 'Error loading user information';
          setError(errorMessage);
          if (error.response?.status === 401) {
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('login')) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }
        } finally {
          setLoading(false);
        }
      } else if (providedAadharNumber) {
        setAadharNumber(providedAadharNumber);
      }
    };

    initializeComponent();
  }, [isProfessional, providedAadharNumber]);

  useEffect(() => {
    if (aadharNumber) {
      console.log('Initializing medical records fetch for Aadhar:', aadharNumber);
      fetchRecords();
    }
  }, [aadharNumber]);

  const fetchRecords = async () => {
    try {
      if (!aadharNumber) {
        console.error('No Aadhar number provided');
        setError('No Aadhar number provided');
        return;
      }
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      console.log('Fetching records for Aadhar:', aadharNumber);
      const response = await axios.get(`http://localhost:3001/api/medical-records/aadhar/${aadharNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Received records:', response.data);
      
      if (Array.isArray(response.data)) {
        setRecords(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      const errorMessage = error.response?.data?.message || 'Error loading medical records';
      setError(errorMessage);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please login again.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !description) {
      alert('Please fill in all fields and select a file');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }

    if (!aadharNumber) {
      setError('No Aadhar number provided');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('aadharNumber', aadharNumber);
    formData.append('uploadedBy', isProfessional ? localStorage.getItem('professionalId') : aadharNumber);
    formData.append('uploadedByType', isProfessional ? 'professional' : 'user');

    try {
      console.log('Uploading medical record for Aadhar:', aadharNumber);
      const response = await axios.post('http://localhost:3001/api/medical-records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      
      console.log('Upload response:', response.data);
      if (response.data.message) {
        alert(response.data.message);
      }

      setFile(null);
      setTitle('');
      setDescription('');
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Fetch records again after successful upload
      await fetchRecords();
    } catch (error) {
      console.error('Error uploading medical record:', error);
      const errorMessage = error.response?.data?.message || 'Error uploading medical record';
      setError(errorMessage);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please login again.');
      } else if (error.response?.status === 413 || 
                (error.response?.data?.error && error.response?.data?.error.includes('file size'))) {
        alert('File size too large. Please choose a file smaller than 5MB.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update the file URL in the records display
  const getFileUrl = (fileUrl) => {
    return `http://localhost:3001${fileUrl}`;
  };

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Medical Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Record Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required
            />
            <Button type="submit" disabled={loading || !aadharNumber}>
              {loading ? 'Uploading...' : 'Upload Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Records Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            {records.length === 0 ? (
              <div className="text-gray-500 p-4 text-center">
                {isProfessional 
                  ? 'Please scan a user to view their medical records.'
                  : loading 
                    ? 'Loading medical records...' 
                    : 'No medical records found.'}
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record._id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{record.title}</h3>
                        <p className="text-sm text-gray-600">{record.description}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded on: {format(new Date(record.uploadDate), 'PPp')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded by: {record.uploadedByType === 'professional' ? 'Healthcare Professional' : 'Patient'}
                        </p>
                      </div>
                      <a
                        href={`http://localhost:3001${record.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition duration-300"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalRecords;
