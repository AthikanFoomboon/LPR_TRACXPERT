import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOutlined, ReloadOutlined } from '@ant-design/icons';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import ListTable from './Table';
import StatusDrawer from './StatusDrawer';
import { io } from 'socket.io-client';
import { streaming_API } from '../../functions/LPR';
import { useSelector } from 'react-redux';
import '../layout/styles/EntranceGate.css';

const SOCKET_SERVER_URL = 'http://localhost:8080';

const EntranceGate = ({ it, updatelicensePlate, img, fullFrame }) => {
  const [isError, setIsError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [licensePlate, setLicensePlate] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [streamStatuses, setStreamStatuses] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [playerDisabled, setPlayerDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [lastClickTime, setLastClickTime] = useState(0);  // Track the last click time

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const user = useSelector(state => state.user);

  // ฟังก์ชันสำหรับรีเซ็ตค่าทั้งหมด
  const resetAll = useCallback(() => {
    setIsOpen(false);
    setNodeStatuses([]);
    setStreamStatuses([]);
    setPlayerDisabled(false);
    setLicensePlate(null); // ล้างค่า license plate ด้วย

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    console.log('All states have been reset.');
  }, []);

  // ฟังก์ชันสำหรับรีเฟรชหน้าและรีเซ็ตสถานะ
  const handleRefresh = useCallback(() => {
    resetAll();  // เรียกใช้ฟังก์ชัน resetAll
    window.location.reload(); // รีเฟรชหน้าใหม่
  }, [resetAll]);

  // เริ่มต้น streamId ตาม prop it
  useEffect(() => {
    if (!it?.vdo) {
      console.warn('it or it.vdo is not defined');
      setIsLoading(true);
      return;
    }

    const streamMapping = { '1': 'stream1', '2': 'stream2' };
    const newStreamId = streamMapping[it.vdo];
    if (newStreamId) {
      setStreamId(newStreamId);
      setIsLoading(false);
      localStorage.setItem('streamId', newStreamId);
    } else {
      console.warn(`Unknown vdo value: ${it.vdo}`);
      setIsLoading(false);
    }
  }, [it]);

  // Retrieve streamId จาก localStorage ถ้ายังไม่ตั้งค่า
  useEffect(() => {
    const savedStreamId = localStorage.getItem('streamId');
    if (savedStreamId && !streamId) {
      setStreamId(savedStreamId);
      setIsLoading(false);
    }
  }, [streamId]);

  // ทำการเรียก API สำหรับการสตรีม
  useEffect(() => {
    if (user?.token && streamId) {
      const data = { ...user, streamId };
      streaming_API(user.token, data)
        .then((res) => {
          if (res?.data) {
            console.log('Streaming API Response:', res.data);
          } else {
            console.warn('Incomplete data from streaming API');
          }
        })
        .catch((err) => {
          console.error('Streaming API Error:', err);
          setIsError(err);
        });
    }
  }, [user, streamId]);

  // เริ่มต้นหรืออัปเดต video.js player
  useEffect(() => {
    if (isLoading || playerDisabled || !videoRef.current || !streamId) return;

    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: false,
        autoplay: true,
        preload: 'auto',
        fluid: true,
        sources: [
          {
            src: `http://localhost:8080/hls/${streamId}/${streamId}.m3u8`,
            type: 'application/x-mpegURL',
          },
        ],
      });

      playerRef.current.on('error', () => {
        const error = playerRef.current?.error();
        console.log(error);
      });
    } else {
      const newSource = `http://localhost:8080/hls/${streamId}/${streamId}.m3u8`;
      if (newSource !== playerRef.current.src()) {
        playerRef.current.src({ type: 'application/x-mpegURL', src: newSource });
        playerRef.current.play().catch((err) => {
          console.error('Error playing the stream:', err);
          window.location.reload();
        });
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        console.log('Video.js player disposed.');
        playerRef.current = null;
      }
    };
  }, [streamId, playerDisabled, isLoading]);

  // การเชื่อมต่อกับ socket และการอัปเดตสถานะ
  useEffect(() => {
    if (user?.token && streamId) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        auth: { token: user.token },
        query: { userId: user.id },
      });

      socketRef.current.on('connect', () => console.log('Connected to Socket.IO server.'));
      socketRef.current.on('connect_error', (error) => console.error('Socket.IO connection failed:', error));

      socketRef.current.on('gateStatus', (data) => setIsOpen(data.isOpen));
      socketRef.current.on('streamStatus', (data) => setStreamStatuses((prev) => updateStreamStatuses(prev, data)));
      socketRef.current.on('nodeStatus', (data) => setNodeStatuses((prev) => updateNodeStatuses(prev, data)));

      socketRef.current.on('licensePlate', (status) => {
        setLicensePlate(status);
        console.log('License Plate:', status);
      });

      socketRef.current.emit('nodeIPuser', user.id);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Disconnected from Socket.IO server.');
      }
    };
  }, [user, streamId]);

  const updateStreamStatuses = (prevStatuses, data) => {
    const index = prevStatuses.findIndex((stream) => stream.streamId === data.streamId);
    if (index !== -1) {
      const updated = [...prevStatuses];
      updated[index] = data;
      return updated;
    }
    return [...prevStatuses, data];
  };

  const updateNodeStatuses = (prevStatuses, data) => {
    const index = prevStatuses.findIndex((node) => node.ip === data.ip);
    if (index !== -1) {
      const updated = [...prevStatuses];
      updated[index] = data;
      return updated;
    }
    return [...prevStatuses, data];
  };

  const [isDisabled, setIsDisabled] = useState(false);  // สถานะของปุ่ม

  const toggleGate = useCallback(() => {
    const currentTime = Date.now();  // Get current timestamp

    if (currentTime - lastClickTime >= 3000) {
      if (socketRef.current && user) {
        socketRef.current.emit('toggleGate', { isOpen: it.way });
        setLastClickTime(currentTime);  // Update the last click time
        setIsDisabled(false);  // เปิดใช้งานปุ่มหลังจากคลิกสำเร็จ
      }
    } else {
      console.log('Please wait 3 seconds before trying again.');
      setIsDisabled(true);  // ปิดการใช้งานปุ่มในระหว่างรอ
    }
  }, [user, it, lastClickTime]);

  const handleSnapScreenshot = useCallback(() => {
    if (streamId) {
      console.log('Emitting snapCamera with streamId:', streamId);
      socketRef.current.emit('snapCamera', streamId);
    } else {
      console.warn('streamId is null. Cannot emit snapCamera.');
    }
  }, [streamId]);

  const showDrawer = () => setDrawerVisible(true);
  const onCloseDrawer = () => setDrawerVisible(false);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <StatusDrawer
        open={drawerVisible}
        onClose={onCloseDrawer}
        nodeStatuses={nodeStatuses}
        streamStatuses={streamStatuses}
        placement={'left'}
      />

      <div className="video">
        <div className="video-container">


          <img
            src={fullFrame}
            style={{ width: '100%', minWidth: '60%' }}
            alt="Full Frame"
            
          />

          <CameraOutlined
            className="save-icon"
            title="Snap Screenshot"
            onClick={handleSnapScreenshot}
          />

          <ReloadOutlined
            className="refresh-icon"
            title="Refresh Page"
            onClick={handleRefresh}
          />
        </div>
      </div>

      <div className="in-container">
        <p className="way">{it.way}</p>
        <div className="focus-license">
          <img
            src={img}
            alt="Focus"
          />
        </div>
      </div>

      <div className="box1"><p>{updatelicensePlate}</p></div>

      <div className="box2">
        <button className="toggle-button" onClick={toggleGate}>
          เปิดประตู
        </button>
      </div>

      <div className="box3"><ListTable /></div>
    </div>
  );
};

export default EntranceGate;
