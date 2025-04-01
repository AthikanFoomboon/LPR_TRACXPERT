import React, { useEffect, useState, useCallback } from 'react';
import { Col, Tooltip, Row, message } from 'antd';
import { ApartmentOutlined, SwapOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons';
import EntranceGate from '../../layout/EntranceGate';
import MenuBar from '../../layout/MenuBar';
import './styles/Dashboard.css';
import StatusDrawer from '../../layout/StatusDrawer';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const SOCKET_SERVER_URL = 'http://localhost:8080';

function Dashboard() {
  const defaultEntrances = {
    way1: { way: 'IN', vdo: "1", licensePlate: null, fileUrl: null },
    way2: { way: 'OUT', vdo: "2", licensePlate: null, fileUrl: null }
  };
  const navigate = useNavigate();

  // ดึงข้อมูลจาก localStorage และตรวจสอบว่าไม่มีข้อมูลจะใช้ค่าเริ่มต้น
  const [entrances, setEntrances] = useState(() => {
    const savedEntrances = localStorage.getItem('entrances');
    return savedEntrances ? JSON.parse(savedEntrances) : defaultEntrances;
  });

  // ใช้ useCallback เพื่อให้แน่ใจว่าไม่เกิดการ re-render ที่ไม่จำเป็น
  const handleLicensePlateUpdate = useCallback((way, status) => { 
    const updatedEntrances = { ...entrances, [way]: { ...entrances[way], ...status } };
    setEntrances(updatedEntrances);
    localStorage.setItem('entrances', JSON.stringify(updatedEntrances));
  
  }, [entrances]);

  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [streamStatuses, setStreamStatuses] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      console.log('เชื่อมต่อกับ Socket.io server สำเร็จแล้ว');
    });

    // ฟังก์ชันนี้จะถูกเรียกเมื่อมีข้อมูล streamStatus
    newSocket.on('streamStatus', (data) => {
      setStreamStatuses((prev) => {
        const updated = prev.map((stream) =>
          stream.streamId === data.streamId ? data : stream
        );
        return updated.length ? updated : [...prev, data];
      });
    });

    // ฟังก์ชันนี้จะถูกเรียกเมื่อมีข้อมูล nodeStatus
    newSocket.on('nodeStatus', (data) => {
      setNodeStatuses((prev) => {
        // หา node ที่มี IP ซ้ำกัน
        const updated = prev.some((node) => node.ip === data.ip)
          ? prev.map((node) =>
              node.ip === data.ip ? data : node
            )
          : [...prev, data];  // ถ้า IP ไม่ซ้ำเพิ่มเข้าไปใน array

        return updated;
      });
    });


    newSocket.on('licensePlateWay1', (status) => {
      handleLicensePlateUpdate('way1', status);
    });
    newSocket.on('licensePlateWay2', (status) => {
      handleLicensePlateUpdate('way2', status);
    });


    newSocket.on('refleshAndRestart', (res) => {
      console.log(res);
    });

    return () => {
      newSocket.disconnect();
      console.log('ตัดการเชื่อมต่อจาก Socket.io server แล้ว');
    };
  }, [handleLicensePlateUpdate]);

  const showDrawer = (action) => {
    setCurrentAction(action);
    setDrawerVisible(true);
  };

  const showDrawer1 = () => {
    message.info('ฟังก์ชันยังไม่พร้อมใช้งาน');
  };

  const editIP = () => {
    navigate('/connecting-devices');
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentAction(null);
  };

  const handleSwap = () => {
    // สลับค่า IN และ OUT
    const updatedEntrances = {
      way1: { ...entrances.way2, way: 'IN' },
      way2: { ...entrances.way1, way: 'OUT' }
    };
    setEntrances(updatedEntrances);
    localStorage.setItem('entrances', JSON.stringify(updatedEntrances));
  };

  return (
    <div className="dashboard-container">
      <MenuBar />
      <Row className="dashboard-row">
        <Col className="dashboard-col-left">
          <EntranceGate
            it={entrances.way2}
            onLicensePlateUpdate={(status) => handleLicensePlateUpdate('way2', status)}
            updatelicensePlate={entrances.way2.licensePlate}
            img={entrances.way2.fileUrl}
            fullFrame={entrances.way2.fullFrame}
          />
        </Col>

        <Col className="dashboard-col-middle">
          <div className="middle-content" style={{ marginTop: '90px' }}>
            <Tooltip title="สลับ">
              <SwapOutlined className="action-icon" onClick={handleSwap} />
            </Tooltip>
            <Tooltip title="เช็คสถานะกล้อง">
              <ApartmentOutlined className="action-icon" onClick={() => showDrawer('checkStatus')} />
            </Tooltip>
            <Tooltip title="แก้ไข IP กล้อง">
              <EditOutlined className="action-icon" onClick={editIP} />
            </Tooltip>
            <Tooltip title="เริ่มต้นการ Stream ใหม่">
              <PlayCircleOutlined className="action-icon" onClick={showDrawer1} />
            </Tooltip>
          </div>
        </Col>

        <Col className="dashboard-col-right">
          <EntranceGate
            it={entrances.way1}
            onLicensePlateUpdate={(status) => handleLicensePlateUpdate('way1', status)}
            updatelicensePlate={entrances.way1.licensePlate}
            img={entrances.way1.fileUrl}
            fullFrame={entrances.way1.fullFrame}
          />
        </Col>
      </Row>

      <StatusDrawer
        open={drawerVisible}
        onClose={onCloseDrawer}
        nodeStatuses={nodeStatuses}
        streamStatuses={streamStatuses}
        placement={'left'}
        currentAction={currentAction}
      />
    </div>
  );
}

export default Dashboard;
