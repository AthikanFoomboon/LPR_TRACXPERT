const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password, village, phase, subdistrict, district, province } = req.body;
    console.log(email, password, village, phase, subdistrict, district, province)
    // Basic validation without Joi
    if (!email || !password || !village || !phase || !subdistrict || !district || !province) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[1-9]\d*$/.test(phase)) {
      return res.status(400).json({ message: 'Phase must be a positive number' });
    }

    // Check if village with the same phase already exists
    const existingUser = await prisma.village.findFirst({
      where: {
         village:village,
         phase:phase }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Village already exists in this phase' });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await prisma.village.create({
      data: {
        email,
        password: hashPassword,
        village,
        phase,
        subdistrict,
        district,
        province,
      },
    });

    return res.status(201).json({ message: 'Register successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(500).json({ message: 'An error occurred during registration' });
  }
};

exports.login = async (req, res) => {
    const { village,phase,password, autoLogin } = req.body;

    try { 
        const user = await prisma.village.findFirst({
            where: {
                village: village,
                phase:phase
            }
        });

        if (!user || user.role !== "admin") {
            return res.status(400).json({ message: "User not found or not enabled" });
        }

        // step 2 Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // step 3 Create Payload
        const payload = {
            id: user.id,
            village: user.village,
            role: user.role,
            autoLogin: autoLogin ? 'true' : 'false' // ใช้ค่าที่ส่งมาหรือค่าเริ่มต้น
        };

        // step 4 Generate Token
        jwt.sign(payload, process.env.KEY, {}, (err, token) => {
            if (err) {
                return res.status(500).json({ message: "Error generating token" });
            }
            return res.status(200).json({ payload, token });
        });

    } catch (err) {
        console.error('การเชื่อมต่ออินเตอร์เน็ตมีปัญหา');
        console.error(err);
        return res.status(500).json({ message: "การเชื่อมต่ออินเตอร์เน็ตมีปัญหา" });
    }
};

exports.currentUser = async (req, res) => {
    try {
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
        const user = await prisma.village.findFirst({
            where: {
                village: req.user.village
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // สร้าง payload สำหรับส่งกลับไปที่ client
        const payload = {
            id: user.id,
            village: user.village,
            role: user.role,
            autoLogin: user.autoLogin
        };

        return res.status(200).json(payload);

    } catch (err) {
        console.error('Error fetching current user:', err);
        return res.status(500).json({ message: "ข้อผิดพลาดจากการตรวจสอบสิทธิ์การเข้าใช้งานระบบ" });
    }
};
