/* SetCamera.js */
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Alert, Form, Input, Button, Cascader, message, Spin, Typography, Space } from 'antd';
import MenuBar from '../../layout/MenuBar';
import { CameraOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { addFromCamera_API } from '../../../functions/LPR';
import './styles/SetCamera.css';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const SetCamera = () => {
    const SOCKET_SERVER_URL = 'http://localhost:8080';
    const [socket, setSocket] = useState(null);
    const [statusIP, setStatusIP] = useState(null);
    const [ipChecking, setIpChecking] = useState(false);
    const user = useSelector((state) => state.user);
    const idTokenResult = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, [SOCKET_SERVER_URL]);

    const optionLists = [
        { value: 'In', label: 'ทางเข้า', isLeaf: false },
        { value: 'Out', label: 'ทางออก', isLeaf: false },
        { value: 'cameraCard', label: 'กล้องถ่ายบัตร' },
    ];

    const [options, setOptions] = useState(optionLists);

    const onChangeIP = async (e) => {
        const ip = e.target.value.trim(); // ตัดช่องว่างด้านหน้าและด้านหลัง

        if (ip && socket) {
            setIpChecking(true);
            socket.off('setCheckIP');
            socket.emit('checkIP', ip);

            try {
                const statusIP = await new Promise((resolve) => {
                    socket.once('setCheckIP', resolve);
                });
                setStatusIP(statusIP);
            } catch (err) {
                console.error("Error checking IP:", err);
            } finally {
                setIpChecking(false);
            }
        } else {
            setStatusIP(null);
        }
    };

    const loadData = (selectedOptions) => {
        const targetOption = selectedOptions[selectedOptions.length - 1];
        targetOption.loading = true;

        setTimeout(() => {
            targetOption.loading = false;
            targetOption.children = [
                { label: 'กล้องด้านหน้า', value: 'FrontCamera' },
                { label: 'กล้องด้านหลัง', value: 'RearCamera' },
            ];
            setOptions([...options]);
        }, 500);
    };

    const getIPStatusColor = () => {
        if (statusIP === 'up') return 'success';
        if (statusIP === 'down') return 'error';
        return '';
    };

    const onFinish = async (values) => {
        const newValues = { ...values, id: user.id };
        try {
            await addFromCamera_API(idTokenResult, newValues);
            message.success('บันทึกข้อมูลสำเร็จ');
            navigate('/connecting-devices');
        } catch (err) {
            if (err && err.status === 400) {
                message.error(err.data);
            } else {
                console.error('Unexpected error:', err);
                message.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
            }
        }
    };

    const onFinishFailed = () => {
        message.error('การบันทึกข้อมูลล้มเหลว โปรดตรวจสอบข้อมูลอีกครั้ง');
    };

    return (
        <>
            <MenuBar />
            <div className="set-camera-container">
                <Form
                    name="trigger"
                    layout="vertical"
                    autoComplete="off"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    className="set-camera-form"
                >
                    <Title level={4} className="set-camera-title">
                        <CameraOutlined className="camera-icon" style={{ marginRight: '10px' }} />
                        ตั้งค่ากล้อง
                    </Title>
                    <Alert
                        message="โปรดกรอกข้อมูลตามที่กำหนด"
                        type="info"
                        showIcon
                        className="custom-alert"
                    />

                    <Form.Item
                        label="ที่อยู่ (IP Address)"
                        name="ip"
                        hasFeedback
                        validateStatus={getIPStatusColor()}
                        help={statusIP === 'down' ? 'ที่อยู่ IP ไม่ถูกต้อง' : ''}
                        rules={[
                            { required: true, message: 'โปรดกรอกที่อยู่ IP ที่ถูกต้อง' },
                            {
                                pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                message: 'โปรดกรอก IP Address ที่ถูกต้อง',
                            },
                            {
                                pattern: /^\S+$/,
                                message: 'ที่อยู่ IP ห้ามมีช่องว่าง',
                            },
                        ]}
                        normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
                    >
                        <Input
                            placeholder="กรอกที่อยู่ IP"
                            onChange={onChangeIP}
                            suffix={ipChecking && <Spin size="small" />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="ชื่อผู้ใช้ (Username)"
                        name="cameraID"
                        rules={[
                            { required: true, message: 'โปรดกรอกชื่อผู้ใช้' },
                            { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในชื่อผู้ใช้' },
                        ]}
                        normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
                    >
                        <Input placeholder="กรอกชื่อผู้ใช้" />
                    </Form.Item>

                    <Form.Item
                        label="รหัสผ่าน (Password)"
                        name="password"
                        rules={[
                            { required: true, message: 'โปรดกรอกรหัสผ่าน' },
                            { pattern: /^\S+$/, message: 'ห้ามมีช่องว่างในรหัสผ่าน' },
                        ]}
                        normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
                    >
                        <Input.Password placeholder="กรอกรหัสผ่าน" />
                    </Form.Item>

                    <Form.Item
                        label="ช่องสัญญาณ (Channel)"
                        name="channel"
                        rules={[
                            { pattern: /^\S*$/, message: 'ช่องสัญญาณห้ามมีช่องว่าง' },
                        ]}
                        normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
                    >
                        <Input placeholder="ถ้ามี" />
                    </Form.Item>

                    <Form.Item
                        label="ชนิดย่อย (Subtype)"
                        name="subtype"
                        rules={[
                            { pattern: /^\S*$/, message: 'ชนิดย่อยห้ามมีช่องว่าง' },
                        ]}
                        normalize={(value) => value?.trim()} // ตัดช่องว่างด้านหน้าและด้านหลัง
                    >
                        <Input placeholder="ถ้ามี" />
                    </Form.Item>

                    <Form.Item
                        label="ตำแหน่งกล้อง"
                        name="cameraPosition"
                        rules={[{ required: true, message: 'โปรดเลือกตำแหน่งกล้อง' }]}
                    >
                        <Cascader
                            options={options}
                            loadData={loadData}
                            changeOnSelect
                            placeholder="กรุณาเลือกตำแหน่งกล้อง"
                        />
                    </Form.Item>

                    <Form.Item className="submit-button-container">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="custom-button"
                            >
                                บันทึกการตั้งค่าให้
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
};

export default SetCamera;
