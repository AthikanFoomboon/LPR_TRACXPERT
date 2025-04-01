import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, message } from 'antd';
import { LoginHeadler } from '../../../functions/auth';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userToken = useSelector(state => state.user?.token);

  useEffect(()=>{
    if(userToken){
      navigate('/dashboard'); // เส้นทางสำหรับ admin
    }
  },[])
    
  // ฟังก์ชัน logout เพื่อลบ token เก่าออกก่อนการ login ใหม่
  const logoutUser = () => {
    dispatch({ type: 'LOGOUT', payload: null });
    localStorage.removeItem('token');
  };

  const onFinish = (values) => {
    const payload = {
      ...values,
      phase: parseInt(values.phase, 10), // แปลง phase เป็นตัวเลข
    };

    LoginHeadler(payload)
      .then((res) => {
        const { id, village, role } = res.data.payload;
        const { token } = res.data;
        
        // เคลียร์ token เก่า (ถ้ามี) ก่อนบันทึก token ใหม่
        logoutUser();

        dispatch({
          type: 'LOGGED_IN_USER',
          payload: {
            id,
            village,
            role,
            token,
          },
        }); 
        
        localStorage.setItem('token', token);

        roleBasedRedirect(role);
        message.success('เข้าสู่ระบบสำเร็จ!');
      })
      .catch((err) => {
        console.error('Login error:', err);
        message.error(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง!');
      });
  };

  const roleBasedRedirect = (role) => {
    if (role === 'admin') {
      navigate('/dashboard'); // เส้นทางสำหรับ admin
    } else {
      navigate('/'); // เส้นทางเริ่มต้น
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
        }}>ลงชื่อเข้าใช้</h2>
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="หมู่บ้าน"
            name="village"
            rules={[
              { required: true, message: 'กรุณาใส่ชื่อหมู่บ้าน' },
            ]}
          >
            <Input placeholder="กรุณาระบุชื่อหมู่บ้าน" />
          </Form.Item>

          <Form.Item
            label="เฟส"
            name="phase"
            rules={[
              { required: true, message: 'กรุณาระบุเฟสหมู่บ้าน!' },
              { pattern: /^[1-9]\d*$/, message: 'กรุณาใส่เฉพาะตัวเลขที่มากกว่า 0!' },
            ]}
          >
            <Input placeholder="กรุณาระบุเฟสหมู่บ้าน" />
          </Form.Item>

          <Form.Item
            label="รหัสผ่าน"
            name="password"
            rules={[
              { required: true, message: 'กรุณาใส่รหัสผ่านของคุณ!' },
            ]}
          >
            <Input.Password placeholder="กรุณาระบุรหัสผ่าน" />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default Login;