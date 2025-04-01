const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');
const { token } = require('morgan');



let defaultID = null

exports.defaultID = async (req, res, next) => {
    return defaultID
}
// ฟังก์ชันสำหรับเก็บ token ลง Redis

const TOKEN_FILE_PATH = path.join(__dirname, 'defaultToken.txt');

exports.auth = async (req, res, next) => {
    let token = req.headers['authtoken'];
    try {

        if (!token) {
            try {
                token = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
                if (!token) {
                    return res.status(401).json({ msg: 'No token provided' });
                }
            } catch (fileErr) {
                console.error('Error reading token file:', fileErr);
                return res.status(401).json({ msg: 'No token provided and failed to read default token' });
            }
        }



        if (req.headers['authtoken']) {
            fs.writeFile(TOKEN_FILE_PATH, token, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing token to file:', err);
                } else {
                    console.log('Token saved to file successfully.');
                }
            });
        }
        // ตรวจสอบความถูกต้องของ token
        const decoded = jwt.verify(token, process.env.KEY);
        
        defaultID = decoded.id
        req.user = decoded;
        // เก็บ token ลง Redis โดยตั้งเวลาให้หมดอายุหลัง 1 ชั่วโมง (3600 วินาที)

        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

exports.getUserToken = async (req, res, next) => {
    try {
        let token = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
        res.json({ token:token });
    } catch (err) {
        return res.status(500).json({ msg: 'Internal server error' });
    }
};

// ฟังก์ชัน admin check
exports.adminCheck = async (req, res, next) => {
    const { village } = req.user;

    try {
        const user = await prisma.village.findFirst({
            where: {
                village: village,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Village not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin Access denied' });
        }

        next();
    } catch (error) {
        console.error('Error checking admin access:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
