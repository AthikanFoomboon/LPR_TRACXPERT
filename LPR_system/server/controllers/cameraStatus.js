const prisma = require('../config/prisma');
const ping = require('ping');

const startCameraStatusChecker = (io, userId) => {
    const checkStatus = async () => {
        try {
            const cameras = await prisma.camera.findMany({
                where: { villageId: userId },
                select: { ip: true }
            });

            // ใช้ Promise.all เพื่อรอการ ping ทั้งหมด
            const pingPromises = cameras.map(camera =>
                ping.promise.probe(camera.ip)
                    .then(res => ({
                        ip: camera.ip,
                        status: res.alive ? 'เชื่อมต่อ' : 'ขาดการเชื่อมต่อ'
                    }))
                    .catch(err => {
                        console.error(`Ping ไม่สำเร็จสำหรับ IP: ${camera.ip}`, err);
                        return { ip: camera.ip, status: 'ขาดการเชื่อมต่อ' };
                    })
            );

            const results = await Promise.all(pingPromises);

            // ส่งผลลัพธ์การเชื่อมต่อไปยัง Client
            results.forEach(result => {
                io.emit('nodeStatus', result); // ส่งข้อมูลแต่ละ IP และสถานะ
            });

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการตรวจสอบ IP:', error);
        }
    };

    // เริ่มต้นตรวจสอบสถานะทันที
    checkStatus();

    // ตั้งค่าให้ตรวจสอบทุกๆ 3 วินาที
    const intervalId = setInterval(checkStatus, 3000);

    // จัดการให้หยุดการตรวจสอบเมื่อไม่ต้องการ
    return () => clearInterval(intervalId);
};

// API สำหรับดึงข้อมูลกล้อง
const listDeviceConnection = async (req, res) => {
    const { userId } = req.body;
    try {
        const cameraList = await prisma.camera.findMany({
            where: { villageId: userId }
        });
        res.json(cameraList);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลกล้อง', err);
        return res.status(400).send('เกิดปัญหาจากการดึงข้อมูล');
    }
};

// API สำหรับแก้ไขข้อมูลกล้อง
const EditlistDeviceConnection = async (req, res) => {
    const { data } = req.body;
    try {
        const updatedCamera = await prisma.camera.update({
            where: {
                villageId: data.userId,
                ip: data.originalIp
            },
            data: {
                ip: data.ip,
                cameraID: data.cameraID,
                password: data.password,
                channel: data.channel,
                subtype: data.subtype,
                way: data.way,
                cameraPosition: data.cameraPosition
            }
        });

        console.log('ข้อมูลกล้องที่ถูกแก้ไข:', data);
        res.json(updatedCamera);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลกล้อง', err);
        return res.status(400).send('เกิดปัญหาจากการแก้ไขข้อมูล');
    }
};

// API สำหรับลบข้อมูลกล้อง
const RemovelistDeviceConnection = async (req, res) => {
    const { data } = req.body;
    try {
        const deletedCamera = await prisma.camera.delete({
            where: {
                villageId: data.userId,
                ip: data.ip
            }
        });

        res.json(deletedCamera);
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลกล้อง', err);
        return res.status(400).send('เกิดปัญหาจากการลบข้อมูล');
    }
};

module.exports = {
    startCameraStatusChecker,
    listDeviceConnection,
    EditlistDeviceConnection,
    RemovelistDeviceConnection
};
