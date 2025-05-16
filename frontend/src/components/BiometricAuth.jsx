import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BiometricAuth = ({ onSuccess, onError, isOptional = false }) => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if the browser supports biometric authentication
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(available => setIsAvailable(available))
                .catch(() => setIsAvailable(false));
        }
    }, []);

    const handleBiometricAuth = async () => {
        if (!isAvailable) {
            onError('Biometric authentication is not available on this device');
            return;
        }

        setIsLoading(true);
        try {
            // Create a challenge
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // Create credential options
            const credentialCreationOptions = {
                publicKey: {
                    challenge,
                    rp: {
                        name: 'FaceDX',
                        id: window.location.hostname
                    },
                    user: {
                        id: Uint8Array.from('USER_ID', c => c.charCodeAt(0)),
                        name: 'user@example.com',
                        displayName: 'User'
                    },
                    pubKeyCredParams: [{
                        type: 'public-key',
                        alg: -7 // ES256
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required'
                    },
                    timeout: 60000
                }
            };

            // Create credentials
            const credential = await navigator.credentials.create(credentialCreationOptions);
            
            if (credential) {
                onSuccess(credential);
            } else {
                throw new Error('Failed to create credentials');
            }
        } catch (error) {
            console.error('Biometric authentication error:', error);
            onError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAvailable && !isOptional) {
        return (
            <div className="biometric-error">
                <p>Biometric authentication is not available on this device.</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="biometric-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <button
                onClick={handleBiometricAuth}
                disabled={isLoading}
                className={`biometric-button ${isOptional ? 'optional' : ''}`}
                style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isOptional ? '#f0f0f0' : '#4a90e2',
                    color: isOptional ? '#333' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                }}
            >
                <span className="fingerprint-icon" role="img" aria-label="fingerprint">
                    👆
                </span>
                {isLoading ? 'Verifying...' : isOptional ? 'Use Biometric (Optional)' : 'Verify with Biometric'}
            </button>
            {isOptional && (
                <p style={{ 
                    fontSize: '14px', 
                    color: '#666', 
                    marginTop: '8px',
                    textAlign: 'center' 
                }}>
                    You can skip this step if you prefer
                </p>
            )}
        </motion.div>
    );
};

export default BiometricAuth;
