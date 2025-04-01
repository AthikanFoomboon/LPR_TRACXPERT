import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import LoadingToRedirect from './LoadingToRedirect';
import { currentAdmin } from '../functions/auth';

const AdminRoute = ({ children }) => {
    let user = useSelector(state => state.user?.token);
    
    const [ok, setOk] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            if (user) {
                try {
                 await currentAdmin(user);
                    setOk(true);  // ตั้งค่าว่าเป็น Admin
                } catch (error) {
                    console.error('Admin route error:', error);
                    setOk(false);  // ไม่ใช่ Admin
                }
            } else {
                setOk(false);  // ไม่มี token, ไม่ใช่ Admin
            }
            setLoading(false);  // หยุดโหลดเมื่อเสร็จสิ้น
        };
        verifyAdmin();  // เรียกฟังก์ชันเพื่อตรวจสอบ Admin
    }, [user]);

    // ระหว่างการโหลด ให้แสดง LoadingToRedirect
    if (loading) {
        return <LoadingToRedirect />;
    }

    // ถ้า ok เป็น true (ผ่านการตรวจสอบสิทธิ์) แสดง children
    // ถ้าไม่ผ่าน ให้เปลี่ยนเส้นทางไปยังหน้า login
    return ok ? (
      <>        {children}
      </>
    ) : (
      <>
        {console.log('Redirecting to login')}
        <Navigate to="/login" replace />
      </>
    );
}

export default AdminRoute;
