require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Initialize Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is required. Please check your .env file in the backend directory.');
}

router.post('/chat', async (req, res) => {
    try {
        console.log('Received chat request:', {
            messageExists: !!req.body.message,
            messageLength: req.body.message ? req.body.message.length : 0
        });

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                details: 'Please provide a message to process'
            });
        }

        console.log('Sending request to Gemini API...');
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `As a mental health assistant, please provide a supportive and helpful response to this message: ${message}`
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Received response from Gemini API');

        if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
            throw new Error('Invalid response format from Gemini API');
        }

        const generatedText = response.data.candidates[0].content.parts[0].text;
        console.log('Successfully processed response');

        return res.json({ response: generatedText });
    } catch (error) {
        console.error('Chatbot error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            status: error.status
        });

        // Handle specific error cases
        if (error.message.includes('API key')) {
            return res.status(500).json({ 
                error: 'API configuration error',
                details: 'The chatbot service is currently unavailable due to a configuration issue. Please try again later.'
            });
        }

        if (error.response?.status === 400) {
            return res.status(400).json({ 
                error: 'Content safety error',
                details: 'The response was blocked due to safety concerns'
            });
        }

        // Network or timeout errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({
                error: 'Service unavailable',
                details: 'The chatbot service is temporarily unavailable. Please try again later.'
            });
        }

        return res.status(500).json({ 
            error: 'Failed to process message',
            details: 'An unexpected error occurred. Please try again.'
        });
    }
});

module.exports = router;
