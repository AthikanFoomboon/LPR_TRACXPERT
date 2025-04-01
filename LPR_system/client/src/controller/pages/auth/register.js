import React from 'react';
import { Button, Form, Input, InputNumber,message } from 'antd';
import { registerHeadler } from '../../../functions/auth';
import { useNavigate } from 'react-router-dom';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const Register = () => {
 const navigate = useNavigate()
  const [form] = Form.useForm();

  const onFinish = (values) => {
    registerHeadler(values)
      .then((res) => {
        // แสดงข้อความสำเร็จ
        message.success('บันทึกข้อมูลเรียบร้อย');
  
        // ใช้ setTimeout เพื่อรอ 1.5 วินาที ก่อนที่จะ navigate ไปยังหน้า login
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        // แสดงข้อความข้อผิดพลาด
        message.error('เกิดข้อผิดพลาดจากเชื่อมต่ออินเตอร์เนต');
        console.error('Registration failed:', err);
      });
  };
  

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '400px', padding: '20px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', borderRadius: '8px', backgroundColor: 'white' }}>
        <h2 style={{ textAlign: 'center' }}>REGISTER</h2>
        <Form
          {...layout}
          form={form}
          name="register"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="email"
            label="อีเมล"
            rules={[
              { type: 'email', message: 'กรุณากรอกอีเมลให้ถูกต้อง!' },
              { required: true, message: 'กรุณากรอกอีเมล!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในอีเมล!' },
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="รหัสผ่าน"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสผ่าน!' },
              { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในรหัสผ่าน!' },
            ]}
            hasFeedback
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="ยืนยันรหัสผ่าน"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'กรุณายืนยันรหัสผ่าน!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน!'));
                },
              }),
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="village"
            label="ชื่อหมู่บ้าน"
            rules={[
              { required: true, message: 'กรุณากรอกชื่อหมู่บ้าน!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในชื่อหมู่บ้าน!' },
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="เฟส"
            name="phase"
            rules={[
              { required: true, message: 'กรุณาระบุเฟสหมู่บ้าน!' },
              { pattern: /^[1-9]\d*$/, message: 'กรุณาใส่เฉพาะตัวเลขที่มากกว่า 0!' },
            ]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item
            name="subdistrict"
            label="ตำบล"
            rules={[
              { required: true, message: 'กรุณากรอกตำบล!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในตำบล!' },
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="district"
            label="อำเภอ"
            rules={[
              { required: true, message: 'กรุณากรอกอำเภอ!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในอำเภอ!' },
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="province"
            label="จังหวัด"
            rules={[
              { required: true, message: 'กรุณากรอกจังหวัด!' },
              { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในจังหวัด!' },
            ]}
            normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
          >
            <Input />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">
              ลงทะเบียน
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
