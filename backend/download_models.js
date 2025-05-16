const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODEL_DIR = path.join(__dirname, 'models');

const models = [
    'tiny_face_detector_model-shard1',
    'tiny_face_detector_model-weights_manifest.json',
    'face_landmark_68_tiny_model-shard1',
    'face_landmark_68_tiny_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_recognition_model-weights_manifest.json'
];

async function downloadFile(fileName) {
    const url = `${MODEL_URL}/${fileName}`;
    const filePath = path.join(MODEL_DIR, fileName);
    
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(filePath, response.data);
        console.log(`Downloaded ${fileName}`);
    } catch (error) {
        console.error(`Error downloading ${fileName}:`, error.message);
    }
}

async function downloadModels() {
    try {
        // Create models directory if it doesn't exist
        try {
            await fs.mkdir(MODEL_DIR);
            console.log('Created models directory');
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }

        // Download all models
        console.log('Downloading models...');
        await Promise.all(models.map(model => downloadFile(model)));
        console.log('All models downloaded successfully');
    } catch (error) {
        console.error('Error downloading models:', error);
    }
}

downloadModels();
