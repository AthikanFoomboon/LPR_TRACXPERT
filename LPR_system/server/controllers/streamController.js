// controllers/streamController.js
const ping = require('ping'); // ใช้ตรวจสอบการเชื่อมต่อเครือข่ายกับ IP
const prisma = require('../config/prisma'); // เชื่อมต่อกับฐานข้อมูลผ่าน Prisma
const axios = require('axios');

// ตัวแปรเก็บข้อมูลกล้อง RTSP ที่ดึงมาจากฐานข้อมูล
let rtspPhotocall = [];

const setRTSP = async (id) => {
  defaultID = id
  rtspPhotocall = []; // รีเซ็ตข้อมูลกล้องก่อนเริ่ม
  try {
    // ดึงข้อมูลกล้องจากฐานข้อมูลที่ตรงตามเงื่อนไข
    let dataCameras = await prisma.camera.findMany({
      where: {
        villageId: id,
        way: {
          in: ['IN', 'OUT'] // ค้นหากล้องที่มีทางเข้าและออก
        },
        cameraPosition: 'FrontCamera' // ตำแหน่งกล้องหน้า
      }
    });

    // วนลูปผ่านข้อมูลกล้องที่ดึงมาและเพิ่มเข้าไปใน rtspPhotocall
    dataCameras.forEach((camera, index) => {
      if ((camera.way === 'In' || camera.way === 'Out') && camera.cameraPosition === 'FrontCamera') {
        if (camera.way === 'In') {
          rtspPhotocall.push({
            id: `stream1`,
            ip: camera.ip, // IP ของกล้อง
            cameraID: camera.cameraID, // ชื่อผู้ใช้สำหรับเข้าถึงกล้อง
            password: camera.password, // รหัสผ่านสำหรับเข้าถึงกล้อง
            channel: camera.channel, // ช่องทางของกล้อง (ถ้ามี)
            subtype: camera.subtype // ประเภทของกล้อง (ถ้ามี)
          });
        }
        if (camera.way === 'Out') {
          rtspPhotocall.push({
            id: `stream2`,
            ip: camera.ip, // IP ของกล้อง
            cameraID: camera.cameraID, // ชื่อผู้ใช้สำหรับเข้าถึงกล้อง
            password: camera.password, // รหัสผ่านสำหรับเข้าถึงกล้อง
            channel: camera.channel, // ช่องทางของกล้อง (ถ้ามี)
            subtype: camera.subtype // ประเภทของกล้อง (ถ้ามี)
          });
        }
      }

    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตั้งค่า RTSP:', error);
  }
};


// ฟังก์ชันสร้าง URL RTSP สำหรับกล้องแต่ละตัว
const generateRTSPUrl = (camera) => {
  const { cameraID, password, ip, channel, subtype } = camera;
  let url
  // สร้าง URL พื้นฐานสำหรับ RTSP
  if (cameraID && password) {
    url = `rtsp://${encodeURIComponent(cameraID)}:${encodeURIComponent(password)}@${ip}`;
  }
  // ถ้ามี channel และ subtype ให้เพิ่มพารามิเตอร์เข้าไปใน URL
  if (channel && subtype) {
    url += `/cam/realmonitor?channel=${channel}&subtype=${subtype}`;
  }
  return url; // คืนค่า URL ที่สร้างขึ้น
};


// ฟังก์ชันสร้าง URL RTSP สำหรับกล้องทุกตัวใน rtspPhotocall
const getRTSPUrls = () => rtspPhotocall.map(generateRTSPUrl);


// ฟังก์ชันเริ่มต้น FFmpeg สำหรับสตรีมที่ระบุ
const startFFmpegForStream = async (deteilStream) => {
  try {
    // if (currentPing.alive) { 
      if (true) { 
        const rtspUrls = getRTSPUrls(); // รับ URL RTSP ทั้งหมด
        
        const cameraIndex = rtspPhotocall.findIndex(cam => cam.id === deteilStream.id); // หา index ของกล้องใน rtspPhotocall
        const rtspURL = rtspUrls[cameraIndex]; // ดึง URL RTSP ของกล้องที่ต้องการ

        const setIPsnap= {
          'streamId' : deteilStream.id,
          'rtspURL' : rtspURL
        }
        console.log('>>>>>>',setIPsnap)
         return setIPsnap
                
      
    } 
    } catch (err) {
      console.error(`ไม่สามารถเริ่มสตรีม ${deteilStream.id} ได้:`, err);
    }
  };



 
 
  // ฟังก์ชันสำหรับเริ่มต้นสตรีมที่ระบุ
  // id: idของหมู่บ้าน
  const captureSnapshotFromRTSP = async (id, streamId) => {
  
    try {
      await setRTSP(id); // ตั้งค่า RTSP จากฐานข้อมูล
      // เซ็คสตรีมที่ตรงกับ id ที่ระบุ
      
      const deteilStream = rtspPhotocall.find(cam => cam.id === streamId);

      if (!deteilStream) { // เช็ค ip กล้องที่บันทึกในระบ เเละตรงในระบบ
        console.error(`ตรวจไม่พบ ip กล้องที่บันทึกในระบบ  กล้อง${streamId} เรียก Streaming`);
      }
      const setIPsnap = await startFFmpegForStream(deteilStream); // เริ่มต้น FFmpeg สำหรับสตรีมที่ระบุ

      return setIPsnap || null

    } catch (err) {

      console.error('ไม่สามารถเริ่มต้นสตรีมได้:', err);
    }
  };


  // ส่งออกฟังก์ชันที่สามารถใช้งานจากไฟล์อื่นได้
  module.exports = {
    captureSnapshotFromRTSP,
  };
