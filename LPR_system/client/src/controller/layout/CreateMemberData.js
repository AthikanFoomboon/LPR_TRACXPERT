// CreateMemberData.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Select, message, Typography, Space } from 'antd';
import { addMemberData_API } from '../../functions/membertData';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { Title } = Typography;

const vehicleTypes = ['รถยนต์', 'รถมอเตอร์ไซค์', 'รถรับจ้าง'];

const CreateMemberData = ({ onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const user = useSelector(state => state.user);
    const [submitting, setSubmitting] = useState(false);

    // ฟังก์ชันสำหรับส่งข้อมูลไปยัง API
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields(); // ตรวจสอบและรับค่าจากฟอร์ม
            const newValues = { ...values, userId: user.id };

            setSubmitting(true);
            const res = await addMemberData_API(user.token, newValues);
            message.success(res.message);

            form.resetFields(); // รีเซ็ตฟอร์มหลังจากสร้างสำเร็จ
            onSuccess(res.data); // ส่งข้อมูลกลับไปยัง Parent Component
        } catch (error) {
            console.error('Error creating member:', error);
            if (error.response?.data?.message) {
                message.error(`Error: ${error.response.data.message}`);
            } else {
                message.error('เกิดข้อผิดพลาดในการสร้างข้อมูลลูกค้า');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            <Form
                form={form}
                layout="vertical"
                name="createMemberForm"
                initialValues={{
                    vehicles: [], // เริ่มต้นด้วยรายการว่าง
                }}
                onFinish={handleSubmit}
            >
                {/* หัวข้อฟอร์ม */}
                <Title level={4} style={{ textAlign: 'center' }}>สร้างฐานข้อมูลลูกค้า</Title>

                {/* ฟิลด์สำหรับบ้านเลขที่ */}
                <Form.Item
                    name="houseNumber"
                    label="บ้านเลขที่"
                    rules={[{ required: true, message: 'กรุณากรอกบ้านเลขที่!' }]}
                >
                    <Input placeholder="กรอกบ้านเลขที่" />
                </Form.Item>

                {/* ฟิลด์สำหรับสถานะ */}
                <Form.Item
                    name="status"
                    label="สถานะ"
                    rules={[{ required: true, message: 'กรุณาเลือกสถานะ!' }]}
                >
                    <Select placeholder="เลือกสถานะ">
                        <Option value="เจ้าของ">เจ้าของ</Option>
                        <Option value="คนเช่า">คนเช่า</Option>
                    </Select>
                </Form.Item>

                {/* ฟิลด์สำหรับการเพิ่มประเภทรถแบบไดนามิก */}
                <Form.List name="vehicles">
                    {(fields, { add, remove }) => (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 16,
                            }}
                        >
                            {fields.map((field, index) => (
                                <Card
                                    size="small"
                                    title={`รถ ${index + 1}`}
                                    key={field.key}
                                    extra={
                                        <CloseOutlined
                                            onClick={() => remove(field.name)}
                                            style={{ color: 'red', cursor: 'pointer' }}
                                        />
                                    }
                                >
                                    {/* ฟิลด์สำหรับประเภทรถ */}
                                    <Form.Item
                                        name={[field.name, 'vehicleType']}
                                        label="ประเภทรถ"
                                        rules={[{ required: true, message: 'กรุณาเลือกประเภทรถ!' }]}
                                    >
                                        <Select placeholder="เลือกประเภทรถ">
                                            {vehicleTypes.map((type) => (
                                                <Option key={type} value={type}>
                                                    {type}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    {/* ฟิลด์สำหรับหมายเลขป้ายทะเบียน */}
                                    <Form.Item
                                        name={[field.name, 'vehicleLicensePlate']}
                                        label="หมายเลขป้ายทะเบียนรถ"
                                        rules={[{ required: true, message: 'กรุณาใส่หมายเลขป้ายทะเบียนรถ!' }]}
                                    >
                                        <Input placeholder="กรอกหมายเลขป้ายทะเบียนรถ" />
                                    </Form.Item>

                                    {/* ฟิลด์สำหรับจังหวัด */}
                                    <Form.Item
                                        name={[field.name, 'province']}
                                        label="จังหวัด"
                                        rules={[{ required: true, message: 'กรุณากรอกจังหวัด!' }]}
                                    >
                                        <Input placeholder="กรอกจังหวัด" />
                                    </Form.Item>
                                </Card>
                            ))}

                            {/* ปุ่มเพิ่มรถใหม่ */}
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                            >
                                เพิ่มรถ
                            </Button>
                        </div>
                    )}
                </Form.List>

                {/* ปุ่มสร้างและยกเลิก */}
                <Form.Item
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '20px',
                    }}
                >
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            style={{
                                backgroundColor: '#4A4A4A', // สีเทาดำ
                                borderColor: '#4A4A4A', // ขอบสีเทาดำ
                            }}
                        >
                            สร้าง
                        </Button>
                        <Button
                            type="default"
                            onClick={onCancel}
                            style={{
                                backgroundColor: '#FFFFFF',
                                color: '#4A4A4A',
                                borderColor: '#4A4A4A',
                            }}
                        >
                            ยกเลิก
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

CreateMemberData.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default CreateMemberData;
