import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Ripple from "./Ripple";
import logo from "../assets/logo.png";

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 8px 32px rgba(0, 77, 64, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 77, 64, 0.1)',
      flex: 1,
      minWidth: '280px',
    }}
  >
    <div style={{ fontSize: '40px', color: '#004d40', marginBottom: '8px' }}>{icon}</div>
    <h3 style={{ fontSize: '24px', color: '#004d40', marginBottom: '8px' }}>{title}</h3>
    <p style={{ fontSize: '16px', color: '#00695c', lineHeight: 1.6 }}>{description}</p>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();

  const handleUseItClick = () => {
    navigate("/login");
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#b4e5e7',
      overflow: 'hidden',
    }}>
      <style>
        {`
          @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(5px, -5px) scale(1.02); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 0.5; }
          }

          @media (max-width: 768px) {
            .hero-content {
              flex-direction: column !important;
              text-align: center;
            }
            .hero-title {
              font-size: 36px !important;
              text-align: center;
            }
            .hero-paragraph {
              font-size: 16px !important;
              text-align: center;
            }
            .hero-button {
              padding: 14px 40px !important;
              font-size: 16px !important;
              width: 200px !important;
              margin-top: 20px !important;
            }
          }
        `}
      </style>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 64px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          width: '100%',
          zIndex: 100,
        }}
      >
        <motion.div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <img 
            src={logo}
            alt="FaceDX Logo" 
            style={{
              height: '40px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
              animation: 'float 6s ease-in-out infinite'
            }}
          />
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #004d40, #009688)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>FaceDX</div>
        </motion.div>
      </motion.header>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 32px 64px',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(180, 229, 231, 0.6), rgba(180, 229, 231, 0.8))',
        textAlign: 'center'
      }}>
        <Ripple />

        <div
          className="hero-content"
          style={{
            maxWidth: '1200px',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '64px',
            position: 'relative',
            zIndex: 1,
            padding: '0 20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Content */}
          <div style={{ flex: '1', minWidth: '280px' }}>
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="hero-title"
              style={{
                fontSize: '64px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #004d40, #00897b)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '24px',
                lineHeight: 1.1,
              }}
            >
              Your Health, Your Identity
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hero-paragraph"
              style={{
                fontSize: '22px',
                color: '#00695c',
                marginBottom: '40px',
                lineHeight: 1.6,
              }}
            >
              Experience the future of healthcare with our revolutionary face recognition technology.
              Access your medical records instantly and securely.
            </motion.p>

            <motion.button
              onClick={handleUseItClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="hero-button"
              style={{
                background: 'linear-gradient(135deg, #004d40, #00796b)',
                color: 'white',
                padding: '20px 60px',
                borderRadius: '16px',
                fontSize: '20px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              }}
            >
              Get Started Now
            </motion.button>
          </div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{
              flex: '1',
              minWidth: '280px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              padding: '20px',
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(129, 199, 132, 0.15))',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'pulse 4s ease-in-out infinite',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.2)',
              border: '2px solid rgba(76, 175, 80, 0.1)',
              overflow: 'hidden',
              padding: '20px',
            }}>
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
              }}>
                <img
                  src={logo}
                  alt="Medical Technology"
                  style={{
                    width: '80%',
                    objectFit: 'contain',
                    animation: 'float 6s ease-in-out infinite',
                    filter: 'drop-shadow(0 4px 12px rgba(76, 175, 80, 0.3))',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
