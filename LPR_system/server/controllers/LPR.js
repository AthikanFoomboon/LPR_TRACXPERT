const prisma = require('../config/prisma');
const { captureSnapshotFromRTSP, extractTextFromImage } = require('./streamController');
const { snapCameraIP } = require('./sendImage'); // นำเข้าไฟล์ที่สร้างขึ้น
const path = require('path');
const { defaultID } = require('../middleware/auth');

// ฟังก์ชันบันทึกข้อมูลกล้องใหม่
const addFromData = async (req, res) => {
    const data = req.body;

    // Log ข้อมูลที่ได้รับจาก request
    try {
        // ตรวจสอบว่ามี IP ซ้ำอยู่ในฐานข้อมูลหรือไม่
        const existingCamera = await prisma.camera.findFirst({
            where: {
                ip: data.fromCamera.ip
            }
        });

        if (existingCamera) {
            // หากมี IP นี้อยู่แล้วในฐานข้อมูล ให้ส่ง response กลับไป
            return res.status(400).send('IP กล้อง มีในระบบอยู่เเล้ว');
        }

        // ถ้าไม่มี IP ซ้ำ ให้สร้างข้อมูลกล้องใหม่
        const result = await prisma.camera.create({
            data: {
                ip: data.fromCamera.ip,
                cameraID: data.fromCamera.cameraID,
                password: data.fromCamera.password,
                channel: data.fromCamera.channel,
                subtype: data.fromCamera.subtype,
                way: data.fromCamera.cameraPosition[0],
                cameraPosition: data.fromCamera.cameraPosition[1],
                villageId: data.fromCamera.id // ถ้ามี villageId ส่งมา ให้เชื่อมกับผู้ใช้
            }
        });

        // Log ผลลัพธ์ที่บันทึกลงฐานข้อมูล
        console.log("Data added to database:", result);

        // ส่งผลลัพธ์กลับไปยัง client
        res.status(200).send('Data added successfully');
    } catch (error) {
        // Log error หากมีปัญหาในการบันทึกข้อมูล
        console.error("Error adding data:", error);
        res.status(500).send('Failed to add data');
    }
}
const extractNumbersAfterText = (str) => {
    // ใช้ regex เพื่อดึงเฉพาะตัวเลขที่ปรากฏหลังจากอักขระที่ไม่ใช่ตัวเลข
    const match = str.match(/[^\d]*(\d+)$/); // แก้ regex เพื่อให้รองรับรูปแบบที่หลากหลายขึ้น
    return match ? match[1] : ''; // ถ้ามี match ให้คืนเฉพาะตัวเลข ถ้าไม่มีก็คืนค่าว่าง
};

// ฟังก์ชันค้นหาการจับคู่เลขที่ตรงกับฐานข้อมูล
const compareLicensePlate = (fastResult, vehicles) => {
    let closestMatch = null;
    let maxMatch = 0; // เก็บจำนวนการจับคู่ที่ดีที่สุด

    // กรองเฉพาะตัวเลขจาก fastResult และทำให้เป็น array
    const fastResultNumbers = String(extractNumbersAfterText(fastResult)).split('').map(Number);
  
    console.log("fastResult Original:", fastResult);
    console.log("fastResult Edit:", fastResultNumbers);

    vehicles.forEach(vehicle => {
        // กรองเฉพาะตัวเลขจากทะเบียนรถและทำให้เป็น array
        const vehicleResultNumbers = String(extractNumbersAfterText(vehicle.licensePlate)).split('').map(Number);

        // ตรวจสอบว่าจำนวนหลักต้องตรงกันก่อนเปรียบเทียบ
        if (fastResultNumbers.length === vehicleResultNumbers.length) {
            // การเปรียบเทียบเลขทะเบียนทีละหลัก
            const match = fastResultNumbers.reduce((count, num, i) => count + (num === vehicleResultNumbers[i] ? 1 : 0), 0);

            // เก็บการจับคู่ที่ดีที่สุด
            if (match > maxMatch) {
                maxMatch = match;

                // กำหนดเงื่อนไขการจับคู่ที่ดีที่สุดตามจำนวนหลัก
                if (
                    (fastResultNumbers.length === 4 && maxMatch > 2) ||
                    (fastResultNumbers.length === 3 && maxMatch === 3) ||
                    (fastResultNumbers.length === 2 && maxMatch === 2) ||
                    (fastResultNumbers.length === 1 && maxMatch === 1)
                ) {
                    closestMatch = vehicle;
                } else {
                    closestMatch = null;
                }
            }
        }
    });

    console.log("🔳 fast_alpr จำนวนที่ตรงกับ:", fastResultNumbers, "[", maxMatch, "]");

    return closestMatch;
};

const snapAndExtractLicensePlate = async (streamId) => {
    const id = await defaultID();
    const maxRetries = 1;
    let attempt = 0;
    let result;

    const vehicles = await prisma.vehicle.findMany({
        where: { villageId: id },
        select: { id: true, licensePlate: true },
    });

    while (attempt < maxRetries) {
        try {
            attempt++;
            console.log(`✅ Attempt ${attempt} to capture snapshot from streamId: ${streamId}`);
            const ipcamera = await captureSnapshotFromRTSP(id, streamId);
            const OCRresponsePath = await snapCameraIP(ipcamera);

            const fileCrop = path.basename(OCRresponsePath.destinationPath.crops);
            const fileFullFrame = path.basename(OCRresponsePath.destinationPath.fullFrame);
            const fileUrl = `http://localhost:8080/img/${fileCrop}`;
            const fullFrame = `http://localhost:8080/img/${fileFullFrame}`;
            const fast_alpr = OCRresponsePath.results.fastAlpr;

            const closestMatch = compareLicensePlate(fast_alpr, vehicles);

            if (closestMatch) {
                console.log('🟢 Matching license plate found >>>', closestMatch.licensePlate);
                result = { success: true, vehicle: closestMatch.licensePlate, fileUrl, fullFrame };
                return result;
            } else {
                console.log('🔴 No matching license plate found');
                result = { success: false, vehicle: `Guest | ${fast_alpr}`, fileUrl, fullFrame };
                continue;
            }

        } catch (err) {
            console.error(`Error in snapAndExtractLicensePlate: ${err.message}`);
            if (attempt >= maxRetries) {
                result = { success: false, vehicle: "ตรวจไม่พบเลขทะเบียน", fileUrl: null, fullFrame: null };
            }
        }
    }

    return result;
};

// Export all functions
module.exports = {
    snapAndExtractLicensePlate,
    addFromData
};
