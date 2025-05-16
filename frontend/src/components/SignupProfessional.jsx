import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BiometricAuth from './BiometricAuth';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignupProfessional = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    doctorId: '',
    password: '',
    contact: '',
    hospital: '',
    specialization: '',
    biometricData: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'password') {
      const { strength, message } = validatePassword(value);
      if (value && strength < 2) {
        toast.info(message + '. Consider adding numbers, special characters, or uppercase letters.');
      }
    }

    if (name === 'contact' && value && !/^[0-9]*$/.test(value)) {
      toast.info('Please enter numbers only for contact');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBiometricSuccess = (biometricData) => {
    setFormData(prev => ({
      ...prev,
      biometricData
    }));
    toast.success('Biometric registration successful!', {
      autoClose: 2000,
      onClose: () => submitRegistration()
    });
  };

  const handleBiometricError = (error) => {
    console.error('Biometric setup failed:', error);
    toast.warning('Biometric setup failed. Proceeding with registration without biometric data.', {
      autoClose: 2000,
      onClose: () => submitRegistration()
    });
  };

  const handleSkipBiometric = async () => {
    submitRegistration();
    // toast.success('Registration successful! Please login', {
    //   autoClose: 2000,
    //   onClose: () => submitRegistration()
    // });
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-green-500';
      case 4:
        return 'bg-green-600';
      default:
        return 'bg-gray-200';
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);

    let strength = 0;
    if (minLength) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    if (hasUppercase) strength++;

    return {
      isValid: minLength,
      strength,
      message: strength < 2 ? 'Weak password' : strength < 3 ? 'Moderate password' : 'Strong password'
    };
  };

  const validateForm = () => {
    const requiredFields = ['name', 'doctorId', 'password', 'contact', 'hospital', 'specialization'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    const { isValid, strength } = validatePassword(formData.password);
    if (!isValid) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (strength < 2) {
      toast.warning('Consider using a stronger password for better security');
    }
  };

  const submitRegistration = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/professional/register`, formData);
      console.log('Registration successful:', response.data);
      
      // Show success toast and wait before navigating
      await new Promise((resolve) => {
        toast.success('Registration successful! Please log in.', {
          autoClose: 2000,
          onClose: resolve
        });
      });
      setLoading(false); // <- stop loading before navigating
      // Add a small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      } else {
        errorMessage += ': Please check your connection and try again';
      }
      toast.error(errorMessage, { 
        autoClose: 3000,
        onClose: () => setLoading(false)
      });
    } finally {
      setLoading(false);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-teal-600"></div>
  //     </div>
  //   );
  // }

  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={2000} 
        hideProgressBar={false} 
        newestOnTop={true} 
        closeOnClick={true} 
        rtl={false} 
        pauseOnFocusLoss={true} 
        draggable={true} 
        pauseOnHover={true} 
        theme="colored"
        limit={3}
      />
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-r from-teal-100 to-teal-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <motion.h2
            className="text-xl sm:text-2xl mb-6 text-center text-teal-800 font-bold"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Professional Registration
          </motion.h2>

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <motion.div
                className=""
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Doctor ID</label>
                <input
                  type="text"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Password</label>
                <div className="space-y-2">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => {
                      handleChange(e);
                      const result = validatePassword(e.target.value);
                      // Password strength is handled by validatePassword
                    }}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                    onBlur={() => {
                      if (!formData.password) toast.info('Please enter a password');
                      else if (formData.password.length < 6) toast.warning('Password should be at least 6 characters long');
                    }}
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor(validatePassword(formData.password).strength)} transition-all duration-300`}
                          style={{ width: `${(validatePassword(formData.password).strength / 4) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {validatePassword(formData.password).message}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  maxLength={15}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Hospital</label>
                <input
                  type="text"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <label className="block text-sm sm:text-base font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:ring-offset-0 focus:outline-none px-3 py-2 text-sm sm:text-base transition-all duration-200 outline-none"
                />
              </motion.div>

              <div className="space-y-4">
                <BiometricAuth
                  onSuccess={handleBiometricSuccess}
                  onError={handleBiometricError}
                  onSkip={handleSkipBiometric}
                />
                <motion.button
                  type="button"
                  className="w-full py-3 rounded-lg shadow-md bg-teal-600 text-white font-semibold text-sm sm:text-base hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 transition-all duration-200"
                  onClick={handleSkipBiometric}
                  whileTap={{ scale: 0.98 }}
                >
                  Skip Biometric and Register
                </motion.button>
              </div>
            </form>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SignupProfessional;
             