// memberDataBase.js
const prisma = require("../config/prisma");
const { defaultID } = require("../middleware/auth");
const xlsx = require('xlsx');

// ฟังก์ชันสำหรับสร้างข้อมูลสมาชิกใหม่พร้อมรถยนต์
const getMemberData = async (req, res) => {
    const { memberData } = req.body;
    console.log(memberData)
    try {
        // ใช้ transaction เพื่อให้แน่ใจว่าทั้งการสร้างสมาชิกและรถยนต์สำเร็จพร้อมกัน
        const result = await prisma.$transaction(async (prisma) => {
            // สร้างข้อมูลสมาชิกใหม่
            const member = await prisma.member.create({
                data: {
                    houseNumber: memberData.houseNumber,
                    status: memberData.status,
                    villageId: memberData.userId, // ตรวจสอบว่า userId คือ villageId จริงหรือไม่
                },
            });
            console.log(member);
            // ตรวจสอบว่า member ถูกสร้างสำเร็จ
            if (!member) {
                throw new Error("ไม่สามารถสร้างข้อมูลสมาชิกได้");
            }

            // สร้างข้อมูลรถยนต์หลายรายการ
            if (memberData.vehicles && Array.isArray(memberData.vehicles)) {
                const vehiclePromises = memberData.vehicles.map((vehicle) => {
                    return prisma.vehicle.create({
                        data: {
                            type: vehicle.vehicleType,
                            licensePlate: vehicle.vehicleLicensePlate,
                            province: vehicle.province,
                            details: vehicle.details || '', // ตรวจสอบว่ามีฟิลด์ details หรือไม่
                            memberId: member.id, // เชื่อมโยงกับสมาชิกที่สร้างใหม่
                            villageId :memberData.userId,
                        },
                    });
                });

                // รอให้ทุกการสร้างรถยนต์เสร็จสิ้น
                await Promise.all(vehiclePromises);
            } else {
                throw new Error("ไม่มีข้อมูลรถยนต์หรือรูปแบบไม่ถูกต้อง");
            }

            return member;
        });
        // ส่งตอบกลับสำเร็จ
        res.status(200).json({
            success: true,
            message: "สร้างข้อมูลสมาชิกสำเร็จ",
            data: result,
        });
    } catch (error) {
        console.error("Error creating member and vehicles:", error);

        // ส่งตอบกลับข้อผิดพลาด
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการสร้างข้อมูลสมาชิก",
            error: error.message,
        });
    }
};

// ฟังก์ชันสำหรับดึงข้อมูลสมาชิกทั้งหมดพร้อมรถยนต์ที่เกี่ยวข้อง
const listMemberData = async (req, res) => {
    const { userId } = req.body;
    
    try {
        // ค้นหาข้อมูลสมาชิกทั้งหมดที่เกี่ยวข้องกับ villageId พร้อมกับข้อมูลรถยนต์ที่เกี่ยวข้อง
        const listDataMember = await prisma.member.findMany({
            where: {
                villageId: userId, // เพิ่มเงื่อนไขการค้นหาตาม userId (villageId)
            },
            include: {
                vehicles: true, // รวมข้อมูลรถยนต์ที่เกี่ยวข้องกับสมาชิกแต่ละคน
            },
            orderBy: {
                createdAt: 'desc', // เรียงลำดับตามวันที่สร้างจากล่าสุดไปหาเก่าสุด
            },
        });

        // ส่งข้อมูลกลับไปยังผู้เรียกใช้งาน
        res.status(200).json({
            success: true,
            data: listDataMember,
        });
    } catch (error) {
        console.error("Error fetching member data:", error);

        // ส่งข้อความข้อผิดพลาดกลับไปยังผู้เรียกใช้งาน
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก",
            error: error.message,
        });
    }
};


const removeMemberData = async (req, res) => {
    try {
      // ดึงข้อมูลที่จำเป็นจาก req.body
      const { houseNumber, id } = req.body.data;
  
      console.log(houseNumber)
      if (!houseNumber || !id) {
        return res.status(400).json({ error: 'กรุณาระบุ houseNumber และ id ให้ครบถ้วน' });
      }
  
      // ลบสมาชิกจากฐานข้อมูล
      const removeMember = await prisma.member.delete({
        where: {
          id: id, // ใช้ `id` เป็นตัวกำหนดหลักในการลบ
        },
      });
  
      console.log('Member deleted:', removeMember);
  
      // ส่งผลลัพธ์กลับไปยัง client
      return res.status(200).json({
        message: 'ลบข้อมูลสมาชิกสำเร็จ',
        member: removeMember,
      });
    } catch (error) {
      console.error('Error removing member:', error);
  
      // ตรวจสอบกรณีที่เกิดปัญหา เช่น ไม่พบข้อมูล
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'ไม่พบข้อมูลสมาชิกที่ต้องการลบ' });
      }
  
      // ส่งสถานะและข้อความแสดงข้อผิดพลาด
      return res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการลบข้อมูลสมาชิก',
        details: error.message,
      });
    }
  };

  const updateMemberData = async (req, res) => {
    const { memberData } = req.body;
    try {
        const result = await prisma.$transaction(async (prisma) => {
            // อัปเดตข้อมูลสมาชิก
            const member = await prisma.member.update({
                where: { id: memberData.id ,
                    villageId :defaultID()
                },
                data: {
                    houseNumber: memberData.houseNumber,
                    status: memberData.status,
                    
                },
            });

            // ลบรถยนต์ที่ไม่ได้อยู่ในรายการใหม่
            const vehicleIds = memberData.vehicles.map((v) => v.id).filter(Boolean);
            await prisma.vehicle.deleteMany({
                where: {
                    memberId: memberData.id,
                    id: { notIn: vehicleIds },
                },
            });

            // อัปเดตรถยนต์ที่มีอยู่และสร้างรถยนต์ใหม่
            const vehiclePromises = memberData.vehicles.map((vehicle) => {
                if (vehicle.id) {
                    return prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: {
                            type: vehicle.vehicleType,
                            licensePlate: vehicle.licensePlate,
                            province: vehicle.province,
                            details: vehicle.details || '',
                            villageId :memberData.villageId,
                            

                        },
                    });
                } else {
                    return prisma.vehicle.create({
                        data: {
                            type: vehicle.vehicleType,
                            licensePlate: vehicle.licensePlate,
                            province: vehicle.province,
                            details: vehicle.details || '',
                            memberId: member.id,
                            villageId :memberData.villageId,
                        },
                    });
                }
            });

            await Promise.all(vehiclePromises);
            return member;
        });

        res.status(200).json({
            success: true,
            message: "อัปเดตข้อมูลสมาชิกสำเร็จ",
            data: result,
        });
    } catch (error) {
        console.error("Error updating member and vehicles:", error);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสมาชิก",
            error: error.message,
        });
    }
};
const exportMemberData = async (req, res) => {
    const id = req.body.user.id; // Assuming villageId is in req.body

    const member_data = await prisma.member.findMany({
        where: {
            villageId: id
        },
        include: {
            vehicles: true // Include vehicles associated with each member
        }
    });

    // Create the initial header row for Excel
    const data = [
        ["ลำดับ", "บ้านเลขที่", "สถานะ", "จำนวนรถ", "รถยนต์", "มอเตอร์ไซค์", "หมายเหตุ"]
    ];

    member_data.forEach((member, index) => {
        // ดึงข้อมูลประเภทยานพาหนะที่เป็น 'รถยนต์'
        const car1Vehicles = member.vehicles.filter((vehicle) => vehicle.type === 'รถยนต์')
            .map((vehicle) => `${vehicle.licensePlate} ${vehicle.province}`);

        const car2Vehicles = member.vehicles.filter((vehicle) => vehicle.type === 'รถมอเตอร์ไซค์')
        .map((vehicle) => `${vehicle.licensePlate} ${vehicle.province}`);

        // ใช้ join("\n") เพื่อให้หมายเลขทะเบียนขึ้นบรรทัดใหม่ภายในเซลล์เดียวกัน
        const car1Plates = car1Vehicles.join("\n");
        const car2Plates = car2Vehicles.join("\n");

        // เพิ่มข้อมูลใน Excel (หรือข้อมูลที่ต้องการ)
        data.push([
            index + 1,           // เพิ่มเลขลำดับ (เริ่มจาก 1)
            member.houseNumber,  // บ้านเลขที่
            member.status,       // สถานะ
            member.vehicles.length, // จำนวนรถ (รวมทุกประเภท)
            car1Plates,          // หมายเลขทะเบียนรถยนต์ในเซลล์เดียวกัน โดยขึ้นบรรทัดใหม่
            car2Plates,         // หมายเลขทะเบียนมอเตอร์ไซค์
            member.details      // หมายเหตุ
        ]);
    });

    // สร้าง worksheet
    const ws = xlsx.utils.aoa_to_sheet(data);

    // ปรับการจัดรูปแบบให้กับคอลัมน์ที่ต้องการให้ wrap text
    const columnsToFormat = ['D', 'E']; // คอลัมน์ที่ต้องการให้ wrap text (ทะเบียนรถยนต์, ทะเบียนมอเตอร์ไซค์)
    columnsToFormat.forEach(col => {
        const range = ws[`${col}1`];  // ใช้โค้ดแบบนี้เพื่อให้ทำงานกับคอลัมน์ D และ E
        const lastRow = data.length;  // จำนวนแถวทั้งหมดที่เรามีใน worksheet
        for (let i = 1; i <= lastRow; i++) {
            const cell = ws[`${col}${i}`];
            if (cell) {
                cell.s = {
                    alignment: {
                        wrapText: true,  // ทำให้ข้อความขึ้นบรรทัดใหม่
                        vertical: "top"  // จัดข้อความให้ชิดขอบด้านบน
                    }
                };
            }
        }
    });

    // สร้างไฟล์ Excel
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Members");

    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename=member_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
    res.end();
};






module.exports = {
    getMemberData,
    listMemberData,
    removeMemberData,
    updateMemberData,
    exportMemberData
    
};
