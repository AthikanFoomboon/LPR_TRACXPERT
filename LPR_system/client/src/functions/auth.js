import axios from 'axios';

export const registerHeadler = async (user) => {

  return await axios.post(process.env.REACT_APP_API + '/register', user, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const LoginHeadler = async (user) => {
  return await axios.post(process.env.REACT_APP_API + '/login', user, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function currentUser(authtoken) {
  return await axios.post(process.env.REACT_APP_API + '/current-user',
    {}, {
    headers: {
      authtoken
    }
  });
}

export async function currentAdmin(authtoken) {
  return await axios.post(process.env.REACT_APP_API + '/current-admin',
    {}, {headers: {authtoken}});
}



export async function getUserToken() {
  try {
    // ส่งคำขอ POST เพื่อดึง token
    const response = await axios.post(process.env.REACT_APP_API + '/getUserToken', {}, {
      headers: {
        'Authorization': `demo`  // ตัวอย่างการใช้ token จาก localStorage
      }
    });
    // ตรวจสอบการตอบกลับจาก API
    if (response.status === 200) {
      return response.data;  // ผลลัพธ์จาก API ที่ตอบกลับมา
    } else {
      console.error('API request failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error while fetching token:', error);
    return null;  // หากเกิดข้อผิดพลาดในการทำคำขอ
  }
}




