// server.js

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIo = require('socket.io');
require('dotenv').config();

const aedes = require('aedes')();
const mqttServer = require('net').createServer(aedes.handle);
const MQTT_PORT = 1883;
const session = require('express-session');

const { captureSnapshotFromRTSP } = require('./controllers/streamController');
const { checkIP } = require('./controllers/checkIP');
const { startCameraStatusChecker } = require('./controllers/cameraStatus');
const { snapAndExtractLicensePlate } = require('./controllers/LPR');
const folderPath = path.join(__dirname, 'snapshots');

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
app.set('view engine', 'eje');
app.use('/img', express.static('snapshots'))
app.use(express.json())

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(morgan('dev'));
app.use(cors());


app.use(session({
  secret: 'your-secret-key', // กำหนด secret key ที่ใช้เข้ารหัส session
  resave: false, // ค่าปกติไม่ต้องบันทึก session ทุกครั้ง
  saveUninitialized: true, // บันทึก session แม้ว่าจะไม่มีการแก้ไขข้อมูล
  cookie: { secure: false } // สำหรับ dev หรือ local กำหนด false, หากใช้ https ให้เป็น true
}));


// Load routes dynamically
fs.readdirSync(path.join(__dirname, 'routes')).forEach(file => {
    if (file.endsWith('.js')) {
        const routePath = path.join(__dirname, 'routes', file);
        const route = require(routePath);
        app.use('/api', route);
    }
});


// Serve HLS streams
app.use('/hls', express.static(path.join(__dirname, 'public/hls')));

// Start MQTT Broker
mqttServer.listen(MQTT_PORT, () => {
    console.log(`Start MQTT Broker Port:`,MQTT_PORT);
});

// Handle MQTT events
aedes.on('client', (client) => {
    console.log(` Connected ESP-32: ${client.id} 🛜`);
});

aedes.on('clientDisconnect', (client) => {
    if (client) {
        console.log(`Client Disconnected: ${client.id}`);
    }




});

aedes.on('publish', async (packet, client) => {
    if (client) {
        const message = {
            topic: packet.topic,
            payload: packet.payload.toString()
        };

        // Broadcast MQTT message to all Socket.IO clients
        io.emit('mqttMessage', message);
        console.log('Received MQTT message:', message);

        // ตรวจสอบว่า payload มีค่า
        if (message.payload) {
            try {
                deleteFilesInFolder();
       
                // ประมวลผลทะเบียนรถจาก payload
                const LicensePlate = await snapAndExtractLicensePlate(message.payload);
                
                // สร้าง object สำหรับส่งข้อมูลไปยัง client
                const response = {
                    licensePlate: LicensePlate.vehicle,
                    fullFrame : LicensePlate.fullFrame || '',  
                    fileUrl: LicensePlate.fileUrl,  
                    success: LicensePlate.success,
                    streamId:message.payload
                };

                // ส่งข้อมูลไปยัง client ตาม stream ที่ได้รับ
                if (LicensePlate.success) {
                    if (message.payload === 'stream1') {
                        io.emit('licensePlateWay1', response);
                    }
                    if (message.payload === 'stream2') {
                        io.emit('licensePlateWay2', response);
                    }
                } else if(LicensePlate){
                    // ส่งข้อความ error หากไม่พบทะเบียน
                    if (message.payload === 'stream1') {
                        io.emit('licensePlateWay1', response);
                    }
                    if (message.payload === 'stream2') {
                        io.emit('licensePlateWay2', response);
                    }
                }

                // หากพบเลขทะเบียนที่ตรงกับ OCR, ส่งคำสั่งเปิดประตูตามคำสั่ง MQTT
                if (LicensePlate.success) {
                    let gateCommand = null;
                    if (message.topic === 'group/command/IN') {
                        gateCommand = 'Gate_IN_OPEN';
                    } else if (message.topic === 'group/command/OUT') {
                        gateCommand = 'Gate_OUT_OPEN';
                    }

                    if (gateCommand) {
                        // ส่งคำสั่งเปิดประตูไปยัง MQTT
                        aedes.publish({
                            topic: 'group/command',
                            payload: gateCommand,
                            qos: 2,
                            retain: false
                        }, (err) => {
                            if (err) {
                                console.log('ไม่สามารถส่งคำสั่งไปที่กล่องควบคุม:', err);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการประมวลผลทะเบียนรถ:', error);
                io.emit('licensePlateError', { error: 'ไม่สามารถประมวลผลทะเบียนรถได้' });
            }
        } else {
            console.log('ไม่มี payload ในข้อความ MQTT');
        }
    }
});


// Socket.IO handling
io.on('connection', (socket) => {
    socket.on('nodeIPuser', (Id) => {
        startCameraStatusChecker(io, Id);
    });

    socket.on('checkIP', async (ip) => {
        try {
            const setCheckIP = await checkIP(ip);
            socket.emit('setCheckIP', setCheckIP);
        } catch (error) {
            console.error('Error checking IP:', error);
            socket.emit('setCheckIP', { status: 'error', message: 'ไม่สามารถตรวจสอบ IP ได้' });
        }
    });

    socket.on('toggleGate', (data) => {
        try {
            if (typeof data.isOpen !== 'string') {
                socket.emit('error', { message: 'ข้อมูลไม่ถูกต้องสำหรับการสลับประตู' });
                return;
            }
            console.log('Gate :',data)
            const gateCommand = data.isOpen === 'IN' ? 'Gate_IN_OPEN' : data.isOpen === 'OUT' ? 'Gate_OUT_OPEN' : null;
            if (!gateCommand) {
                socket.emit('error', { message: 'ค่าของ isOpen ไม่ถูกต้อง' });
                return;
            }
            aedes.publish({
                topic: 'group/command',
                payload: gateCommand,
                qos: 2,
                retain: false
            }, (err) => {});
        } catch (err) {

            console.log(err)

        }

    });

    socket.on('snapCamera', async (streamId) => {
        try {
           deleteFilesInFolder();
                // ประมวลผลทะเบียนรถจาก payload
                const LicensePlate = await snapAndExtractLicensePlate(streamId);

                // สร้าง object สำหรับส่งข้อมูลไปยัง client
                const response = {
                    licensePlate: LicensePlate.vehicle,
                    fullFrame : LicensePlate.fullFrame || '',  
                    fileUrl: LicensePlate.fileUrl,  
                    success: LicensePlate.success,
                    streamId:streamId
                };

                console.log(response)


                // ส่งข้อมูลไปยัง client ตาม stream ที่ได้รับ
                if (LicensePlate.success) {
                    if (streamId === 'stream1') {
                        io.emit('licensePlateWay1', response);
                    }
                    if (streamId === 'stream2') {
                        io.emit('licensePlateWay2', response);
                    }
                } else if(LicensePlate){
                    // ส่งข้อความ error หากไม่พบทะเบียน
                    if (streamId === 'stream1') {
                        io.emit('licensePlateWay1', response);
                    }
                    if (streamId === 'stream2') {
                        io.emit('licensePlateWay2', response);
                    }
                }
            socket.emit('statusSnapCamera', {
                success: true,
                message: 'บันทึกรูปภาพสำเร็จ',
            });
        } catch (err) {
            console.error('Error snapping camera:', err);
            socket.emit('statusSnapCamera', {
                success: false,
                message: 'บันทึกรูปภาพไม่สำเร็จ',
            });
        }
    });


});

// ฟังก์ชันในการลบไฟล์ทั้งหมดในโฟลเดอร์
const deleteFilesInFolder = async() => {
    await fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการอ่านไฟล์ในโฟลเดอร์:', err);
            return;
        }
        if(files.length > 50){
        // ลบไฟล์ทีละไฟล์
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`ไม่สามารถลบไฟล์ ${file}:`, err);
                    } 
                });
            
        });

    }
    });
};

// Start the HTTP server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on port ${PORT} 📟📟📟`));
