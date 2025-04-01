const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { mkdir, access, unlink } = require('fs').promises;
const FormData = require('form-data');
const sharp = require('sharp');

// Ensure folder exists
const ensureFolderExists = async (folderPath) => {
    try {
        await access(folderPath);
    } catch {
        await mkdir(folderPath, { recursive: true });
    }
};

// Delete old files if the folder exceeds 20 files
const deleteOldFiles = async (folderPath) => {
    try {
        const files = await fs.readdir(folderPath);
        if (files.length > 20) {
            const deletePromises = files.sort((a, b) => {
                return fs.stat(path.join(folderPath, a)).mtime - fs.stat(path.join(folderPath, b)).mtime;
            }).slice(0, files.length - 20).map(async (file) => {
                const filePath = path.join(folderPath, file);
                await unlink(filePath);
            });
            await Promise.all(deletePromises);
        }
    } catch (err) {
        console.error('Error deleting old files:', err.message);
    }
};

const saveBase64Image = async (file, folderPath) => {
    try {
        const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        const buffer = matches
            ? Buffer.from(matches[2], 'base64')
            : Buffer.from(file, 'base64');
        const fileType = matches ? matches[1].split('/')[1] : 'png';
        let fileName = `image_${Date.now()}.${fileType}`;
        let filePath = path.join(folderPath, fileName);

        // Ensure unique filename
        let counter = 1;
        while (await fileExists(filePath)) {
            fileName = `image_${Date.now()}_${counter++}.${fileType}`;
            filePath = path.join(folderPath, fileName);
        }

        await fs.writeFile(filePath, buffer);
        return filePath;
    } catch (err) {
        console.error('Error saving Base64 image:', err.message);
        throw err;
    }
};

// Helper function to check if a file exists
const fileExists = async (filePath) => {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
};

// Main function to handle IP camera snapshots
const snapCameraIP = async (ipcamera) => {
    const folderPath = path.join(__dirname, '../snapshots');
    await ensureFolderExists(folderPath);
    await deleteOldFiles(folderPath);

    try {
        const response = await axios.post(
            `${process.env.PROCESSPI5}/snapCamera/yolo`,
            ipcamera,
            { headers: { 'Content-Type': 'application/json' } }
        );

        const plates = response.data.plates && response.data.plates[0];

        if (!plates || Object.keys(plates).length === 0) {
            console.error('No license plates detected by YOLO.');
            return { destinationPath: null, results: null };
        }

        const fastAlpr = plates.alpr_results_digits;

        const destinationPath = {
            fullFrame: await saveBase64Image(plates.fullFrame, folderPath),
            crops: await saveBase64Image(plates.crops, folderPath),
        };

        return { destinationPath, results: { fastAlpr } };
    } catch (err) {
        console.error('Error during YOLO license plate detection:', err.message);
        throw err;
    }
};

module.exports = { snapCameraIP };
