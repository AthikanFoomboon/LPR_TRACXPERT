import React, { useState, useEffect } from 'react';
import { VideoCameraOutlined, AliyunOutlined, ApiOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles/MenuBar.css';

const MenuBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [current, setCurrent] = useState('');

    useEffect(() => {
        const pathToKey = {
            '/dashboard': 'Dashboard',
            '/setcamera': 'setCamera',
            '/connecting-devices': 'Devices',
            '/customer-db': 'CustomerDB',
        };
        const key = pathToKey[location.pathname] || 'Dashboard';
        setCurrent(key);
    }, [location]);

    const items = [
        {
            label: 'แผงควบคุม',
            key: 'Dashboard',
            icon: <AliyunOutlined style={{ fontSize: '18px', color: '#d9d9d9' }} />,
        },
        {
            label: 'ตั้งค่ากล้อง',
            key: 'setCamera',
            icon: <VideoCameraOutlined style={{ fontSize: '18px', color: '#d9d9d9' }} />,
        },
        {
            label: 'อุปกรณ์เชื่อมต่อ',
            key: 'Devices',
            icon: <ApiOutlined style={{ fontSize: '18px', color: '#d9d9d9' }} />,
        },
        {
            label: 'ฐานข้อมูลลูกค้า',
            key: 'CustomerDB',
            icon: <DatabaseOutlined style={{ fontSize: '18px', color: '#d9d9d9' }} />,
        },
    ];

    const onClick = (e) => {
        setCurrent(e.key);
        const keyToPath = {
            Dashboard: '/dashboard',
            setCamera: '/setcamera',
            Devices: '/connecting-devices',
            CustomerDB: '/customer-db',
        };
        navigate(keyToPath[e.key]);
    };
   
    return (
        <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="horizontal"
            theme="dark"
            items={items}
            className="custom-menu-bar"
        />
    );
};

export default MenuBar;
