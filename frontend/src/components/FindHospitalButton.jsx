import React from 'react';
import { motion } from 'framer-motion';
import { FaHospital, FaSearch } from 'react-icons/fa';
import './FindHospitalButton.css';

const FindHospitalButton = ({ onClick }) => {
  return (
    <motion.button
      className="find-hospital-button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="button-content">
        <FaHospital className="hospital-icon" />
        <span className="button-text">Find Hospitals</span>
        <FaSearch className="search-icon" />
      </div>
    </motion.button>
  );
};

export default FindHospitalButton;
