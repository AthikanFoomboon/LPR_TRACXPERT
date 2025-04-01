// controllers/gateController.js

// ฟังก์ชันสำหรับเปิดประตู IN
function openGateIn() {
    // โค้ดสำหรับเปิดประตู IN
    console.log("เปิดประตู IN");
    // เพิ่มโค้ดจริงสำหรับเปิดประตู เช่น การส่งสัญญาณไปยังอุปกรณ์ฮาร์ดแวร์
}

// ฟังก์ชันสำหรับปิดประตู IN
function closeGateIn() {
    // โค้ดสำหรับปิดประตู IN
    console.log("ปิดประตู IN");
    // เพิ่มโค้ดจริงสำหรับปิดประตู
}

// ฟังก์ชันสำหรับเปิดประตู OUT
function openGateOut() {
    // โค้ดสำหรับเปิดประตู OUT
    console.log("เปิดประตู OUT");
    // เพิ่มโค้ดจริงสำหรับเปิดประตู
}

// ฟังก์ชันสำหรับปิดประตู OUT
function closeGateOut() {
    // โค้ดสำหรับปิดประตู OUT
    console.log("ปิดประตู OUT");
    // เพิ่มโค้ดจริงสำหรับปิดประตู
}

// ฟังก์ชันสำหรับสลับสถานะประตู
function toggleGate(isOpen) {
    if (isOpen === 'Gate_IN_OPEN') {
        if (isOpen) {
            openGateIn();
        } else {
            closeGateIn();
        }
    } else if (isOpen === 'Gate_OUT_OPEN') {
        if (isOpen) {
            openGateOut();
        } else {
            closeGateOut();
        }
    }
}


module.exports = {
    toggleGate,
};
