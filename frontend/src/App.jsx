import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import SignupUser from './components/SignupUser';
import SignupProfessional from './components/SignupProfessional';
import UserDashboard from './components/UserDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import ChatBot from './components/ChatBot';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-user" element={<SignupUser />} />
        <Route path="/signup-professional" element={<SignupProfessional />} />
        <Route
          path="/user-dashboard"
          element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/professional-dashboard"
          element={
            <PrivateRoute>
              <ProfessionalDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
      <ChatBot />

    </>
  );
};

export default App;
