// app.js
import React, { useEffect, useState, useCallback } from 'react';
import './style.css';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './controller/pages/admin/dashboard';
import Login from './controller/pages/auth/login';
import ConnectingDevice from './controller/pages/admin/connectingDevice';
import Register from './controller/pages/auth/register';
import SetCamera from './controller/pages/admin/setCamera';
import AdminRoute from './routes/AdminRoute';
import { currentUser, getUserToken } from './functions/auth';
import { useDispatch, useSelector } from 'react-redux';
import MemberDataBase from './controller/pages/admin/memberDataBase';

function App() {
  const dispatch = useDispatch();
  const userTokenRedux = useSelector(state => state.user?.token);
  
  // อ่าน token จาก localStorage เมื่อเริ่มต้น
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชัน logout: ลบ token และ clear Redux state
  const logoutUser = useCallback(() => {
    dispatch({ type: 'LOGOUT', payload: null });
    localStorage.removeItem('token');
    setToken(null);
    setLoading(false);
  }, [dispatch]);

  useEffect(() => {
    const initializeUser = async () => {
      let currentToken = token || userTokenRedux;
      // ถ้าไม่มี token ให้ดึงจาก API
      if (!currentToken) {
        try {
          const res = await getUserToken(); // คาดหวังให้ res มี { token: "..." }
          currentToken = res.token;
          if (currentToken) {
            setToken(currentToken);
            localStorage.setItem('token', currentToken);
          } else {
            logoutUser();
            return;
          }
        } catch (err) {
          console.error('Error fetching token:', err);
          logoutUser();
          return;
        }
      }
      // ใช้ token ที่มีอยู่ในการดึงข้อมูลผู้ใช้
      try {
        const res = await currentUser(currentToken);
        dispatch({
          type: 'LOGGED_IN_USER',
          payload: {
            id: res.data.id,
            village: res.data.village,
            role: res.data.role,
            token: currentToken,
          },
        });
      } catch (err) {
        console.error('Error fetching current user:', err);
        logoutUser();
        return;
      }
      // เมื่อทุกอย่างเสร็จสิ้น ยกเลิก Loading
      setLoading(false);
    };

    initializeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // รันเพียงครั้งเดียวเมื่อ Component mount

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/setcamera" element={<AdminRoute><SetCamera /></AdminRoute>} />
        <Route path="/connecting-devices" element={<AdminRoute><ConnectingDevice /></AdminRoute>} />
        <Route path="/customer-db" element={<AdminRoute><MemberDataBase /></AdminRoute>} />
      </Routes>
    </div>
  );
}

export default App;