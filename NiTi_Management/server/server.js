// server.js

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIo = require('socket.io');
const prisma = require('./config/prisma');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ตั้งค่าการแสดงผล views และใช้ view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // แก้ไขจาก 'eje' เป็น 'ejs'

// Middleware
app.use(express.json({ limit: "4mb" })); // ใช้ middleware เดียว ไม่ซ้ำซ้อน
app.use(morgan('dev'));
app.use(cors());

// Load routes dynamically
fs.readdirSync(path.join(__dirname, 'routes')).forEach(file => {
    if (file.endsWith('.js')) {
        const routePath = path.join(__dirname, 'routes', file);
        const route = require(routePath);
        app.use('/api', route);
    }
});

// การตั้งค่า Socket.io
io.on('connection', (socket) => {

    socket.on('checkHouseNumber', async (message) => {
    try {
        // ค้นหาหมายเลขบ้านในฐานข้อมูล
        const list = await prisma.member.findMany({
            where: { villageId: message.villageId, houseNumber: message.houseNumber },
            select: { houseNumber: true }
        });

        // ตรวจสอบว่า list มีข้อมูลหรือไม่
        if (list.length > 0 && list[0].houseNumber) {
            // ถ้าพบหมายเลขบ้านที่ตรงกัน ส่งข้อมูลกลับ
            socket.emit('getHouseNumber', true);
        } else {
            // ถ้าไม่พบ หรือหมายเลขบ้านไม่ตรงกัน ส่งข้อมูลกลับว่าไม่ตรงกัน
            socket.emit('getHouseNumber', false);
        }
    } catch (err) {
        // จัดการกับข้อผิดพลาด
        console.log('Error in checking house number:', err);
        socket.emit('getHouseNumber', false); // ส่ง false กลับในกรณีเกิดข้อผิดพลาด
    }
});

    socket.on('checkVehicleNumber', async (message) => {
    try {
        // ค้นหาหมายเลขบ้านในฐานข้อมูล
        const list = await prisma.vehicle.findMany({
            where: { villageId: message.villageId, licensePlate: message.vehicleNumber },
            select: {licensePlate: true }
        });

        // ตรวจสอบว่า list มีข้อมูลหรือไม่
        if (list.length > 0 && list[0].licensePlate) {
            // ถ้าพบหมายเลขบ้านที่ตรงกัน ส่งข้อมูลกลับ
            socket.emit('getVehicleNumber', true);
        } else {
            // ถ้าไม่พบ หรือหมายเลขบ้านไม่ตรงกัน ส่งข้อมูลกลับว่าไม่ตรงกัน
            socket.emit('getVehicleNumber', false);
        }
    } catch (err) {
        // จัดการกับข้อผิดพลาด
        console.log('Error in checking house number:', err);
        socket.emit('getVehicleNumber', false); // ส่ง false กลับในกรณีเกิดข้อผิดพลาด
    }
});


    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});




// Start the HTTP server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on port ${PORT} 📟📟📟`));