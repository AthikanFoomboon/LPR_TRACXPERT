// src/functions/user.js
import axios from 'axios';

// ฟังก์ชันสำหรับสร้างผู้ใช้
export const addMemberData_API = async (token, group) => {
    const url = `${process.env.REACT_APP_API}/addMemberData`;
    const headers = { authToken: token };
    const data = { memberData: group };
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error("Error creating person:", error);
        // โยน error กลับไปให้ catch ในที่เรียกใช้ addFromCamera_API()
        throw error.response ? error.response : new Error("Unknown error");
    }
};
export const listMemberData_API = async (token, userId) => {
    const url = `${process.env.REACT_APP_API}/listMemberData`;
    const headers = { authToken: token };
    const data = { userId: userId };
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error("Error creating person:", error);
        // โยน error กลับไปให้ catch ในที่เรียกใช้ addFromCamera_API()
        throw error.response ? error.response : new Error("Unknown error");
    }
};

export const removeMemberData_API = async(token,data)=>{
    const url = `${process.env.REACT_APP_API}/remove-memberData_API`;
    const headers = { authToken: token }; // ตรวจสอบว่า 'null' เป็นสตริงที่ถูกต้องหรือไม่
    const fromdata = {data:data}
    try {
        const response = await axios.post(url, fromdata, { headers });
        return response.data;
    } catch (error) {
        console.error("Error creating person:", error);
        throw error.response ? error.response : new Error("Unknown error");
    }
}

export const updateMemberData_API = async (token, memberData) => {
    const url = `${process.env.REACT_APP_API}/updateMemberData`;
    const headers = { authToken: token };
    const data = { memberData };
    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error("Error updating member:", error);
        throw error.response ? error.response : new Error("Unknown error");
    }
};
export const exportMemberData = async (token, user) => {
    const url = `${process.env.REACT_APP_API}/export-member-data`;
    const headers = { authToken: token };
    const data = { user };


    try {
        const response = await axios.post(url, data, { headers, responseType: 'blob' });

        // สร้าง Blob จากข้อมูลที่ได้รับ
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement('a');
        const fileUrl = window.URL.createObjectURL(blob);

        // ตั้งชื่อไฟล์ให้กับการดาวน์โหลด
        link.href = fileUrl;
        link.setAttribute('download', `member_data_${user}.xlsx`);

        // เพิ่มลิงก์ลงใน DOM และคลิกเพื่อดาวน์โหลด
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  // ลบลิงก์หลังจากคลิกดาวน์โหลด

    } catch (error) {
        console.error("Error exporting member data:", error);
    }
};
