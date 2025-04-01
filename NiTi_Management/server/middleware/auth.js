const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');


let defaultID = null

exports.defaultID = async (req, res, next) => {
    return defaultID
}
// ฟังก์ชันสำหรับเก็บ token ลง Redis

exports.auth = async (req, res, next) => {
    let token = req.headers['authtoken'];

    try {
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

// ฟังก์ชันสำหรับดึง token จาก Redis
exports.getUserToken = async (req, res, next) => {
    try {
        const storedToken = await client.get('user_token');
        if (!storedToken) {
            return res.status(404).json({ msg: 'Token not found in Redis' });
        }
        res.json({ storedToken });
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
