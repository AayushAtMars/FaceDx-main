import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HospitalFinder from './HospitalFinder';
import FindHospitalButton from './FindHospitalButton';
import MedicalRecords from './MedicalRecords';
import './HospitalFinder.css';
import './UserDashboard.css';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [photo, setPhoto] = useState(null);
  const [showHospitalFinder, setShowHospitalFinder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          navigate('/login');
          return;
        }

        console.log('Fetching user data...');
        const response = await axios.get('http://localhost:3001/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('User data received:', response.data);
        setUserData(response.data);
        setFormData(response.data);
        if (response.data.photo) {
          setPhoto(`data:image/jpeg;base64,${response.data.photo}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          alert('Failed to fetch user data: ' + (error.response?.data?.message || error.message));
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3001/update-photo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setPhoto(`data:image/jpeg;base64,${response.data.photo}`);
        alert('Photo updated successfully');
      } catch (error) {
        console.error('Error updating photo:', error);
        alert('Failed to update photo');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/update', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User data updated successfully');
      setIsEditing(false);
      setUserData(formData);
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update user data');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 to-teal-200">
        <motion.div
          className="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: 'linear',
          }}
        >
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent border-solid rounded-full"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h2>Welcome, {userData?.name || 'User'}!</h2>
        </div>
        <div className="nav-right">
          <FindHospitalButton onClick={() => setShowHospitalFinder(true)} />
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-teal-100 to-teal-200">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[32rem] max-w-2xl">
          <h2 className="text-2xl mb-6 text-center text-teal-800 font-bold">User Dashboard</h2>
          
          {/* Photo Section */}
          <div className="mb-6 text-center">
            {photo ? (
              <img
                src={photo}
                alt="User"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-teal-500"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Photo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="bg-teal-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-600 transition duration-300"
            >
              Update Photo
            </label>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Aadhaar Number:</strong> {userData.aadharNumber}</p>
              <p><strong>Emergency Contact:</strong> {userData.emergencyContact}</p>
              <p><strong>Blood Group:</strong> {userData.bloodGroup}</p>
              <p><strong>Allergies:</strong> {userData.allergies || 'None'}</p>
              <p><strong>Past Surgery:</strong> {userData.pastSurgery || 'None'}</p>
              <p><strong>Other Medical Conditions:</strong> {userData.otherMedicalConditions || 'None'}</p>
              <button
                className="bg-teal-600 text-white w-full py-2 mt-4 rounded-lg hover:bg-teal-700 transition duration-300"
                onClick={() => setIsEditing(true)}
              >
                Edit Information
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Past Surgery</label>
                <input
                  type="text"
                  name="pastSurgery"
                  value={formData.pastSurgery}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Other Medical Conditions</label>
                <input
                  type="text"
                  name="otherMedicalConditions"
                  value={formData.otherMedicalConditions}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-teal-600 text-white flex-1 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white flex-1 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-full">
              <h2 className="text-2xl mb-6 text-center text-teal-800 font-bold">Medical Information</h2>
            </div>
            <div className="col-span-full">
              <MedicalRecords userId={userData._id} isProfessional={false} />
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white w-full py-2 mt-6 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
      <HospitalFinder 
        isOpen={showHospitalFinder}
        onClose={() => setShowHospitalFinder(false)}
      />
    </div>
  );
};

export default UserDashboard;
