import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import BiometricAuth from './BiometricAuth';

const LoginPage = () => {
  const [role, setRole] = useState('user');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const role = localStorage.getItem('role');
      navigate(role === 'user' ? '/user-dashboard' : '/professional-dashboard');
    }
  }, [navigate]);

  const handleLogin = async (biometricCredential = null) => {
    setLoading(true);

    try {
      let loginData = { role, password };

      if (role === 'user') {
        loginData.aadharNumber = identifier;
      } else {
        loginData.doctorId = identifier;
      }

      if (biometricCredential) {
        loginData = {
          credentialId: biometricCredential.id,
          role
        };
      }

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, loginData);
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      toast.success('Login successful! Redirecting...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (role === 'user') {
        navigate('/user-dashboard');
      } else {
        navigate('/professional-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setShowBiometric(false);
    }

    if (biometricCredential) {
      toast.success('Biometric authentication successful!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.warning('Please fill in all fields');
      return;
    }
    await handleLogin();
  };

  const handleBiometricSuccess = (credential) => {
    handleLogin(credential);
  };

  const handleBiometricError = (error) => {
    toast.error('Biometric authentication failed: ' + error);
    setShowBiometric(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 to-teal-200 px-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <motion.div
        className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-3xl font-bold text-center text-teal-800 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Login
        </motion.h2>

        {!showBiometric ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.select
              className="w-full p-3 border border-teal-300 rounded-md text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <option value="user">User</option>
              <option value="professional">Medical Professional</option>
            </motion.select>

            <motion.input
              type="text"
              placeholder={role === 'user' ? 'Aadhaar Number' : 'Doctor ID'}
              className="w-full p-3 border border-teal-300 rounded-md text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />

            <motion.input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-teal-300 rounded-md text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />

            <div className="space-y-2">
              <motion.button
                type="submit"
                className={`w-full py-2 rounded-md text-white transition duration-300 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
                }`}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Logging in...' : 'Login with Password'}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setShowBiometric(true)}
                className="w-full py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-300"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Login with Fingerprint
              </motion.button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-3">
            <BiometricAuth
              onSuccess={handleBiometricSuccess}
              onError={handleBiometricError}
              isOptional={false}
            />
            <motion.button
              onClick={() => setShowBiometric(false)}
              className="w-full py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600 transition duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Password Login
            </motion.button>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
          <motion.button
            className="text-teal-600 hover:text-teal-800"
            onClick={() => navigate('/signup-user')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            Signup as User
          </motion.button>
          <motion.button
            className="text-teal-600 hover:text-teal-800"
            onClick={() => navigate('/signup-professional')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            Signup as Professional
          </motion.button>
        </div>

        <motion.button
          className="mt-4 text-sm text-teal-600 hover:text-teal-800 w-full text-center"
          onClick={() => navigate('/')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LoginPage;
