import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    Space,
    Table,
    Button,
    message,
    Spin,
    Modal,
    Form,
    Input,
    Select,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import MenuBar from '../../layout/MenuBar';
import CreateMemberData from '../../layout/CreateMemberData';
import { exportMemberData, listMemberData_API, removeMemberData_API, updateMemberData_API } from '../../../functions/membertData';

import './styles/MemberDataBase.css';

const { Column } = Table;
const { Option } = Select;

const vehicleTypes = ['รถยนต์', 'รถมอเตอร์ไซค์', 'รถรับจ้าง'];

const MemberDataBase = () => {
    const [dataMembers, setDataMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const user = useSelector((state) => state.user);
    const idTokenResult = localStorage.getItem('token');

    // ดึงข้อมูลสมาชิกจาก API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listMemberData_API(idTokenResult, user.id);
            if (res.success) {
                setDataMembers(res.data.map((member) => ({
                    ...member,
                    vehicles: Array.isArray(member.vehicles) ? member.vehicles : [],
                })));
            } else {
                message.error('ไม่สามารถดึงข้อมูลสมาชิกได้');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก');
        } finally {
            setLoading(false);
        }
    }, [idTokenResult, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ฟังก์ชันสำหรับสร้างข้อมูลใหม่
    const handleCreateSuccess = useCallback(() => {
        setIsCreateModalVisible(false);
        fetchData(); // โหลดข้อมูลใหม่
    }, [fetchData]);

    // ฟังก์ชันสำหรับแก้ไขข้อมูล
    const handleEdit = useCallback((record) => {
        setEditingRecord(record);
        setIsEditModalVisible(true);
        form.setFieldsValue({
            houseNumber: record.houseNumber,
            status: record.status,
            vehicles: record.vehicles.map((vehicle) => ({
                vehicleType: vehicle.type,
                licensePlate: vehicle.licensePlate,
                province: vehicle.province,
            })),
        });
    }, [form]);

    const handleEditConfirm = useCallback(async () => {
        try {
            const values = await form.validateFields();
            const updatedRecord = {
                ...editingRecord,
                ...values,
                vehicles: values.vehicles || [],
            };
            setEditLoading(true);
            const res = await updateMemberData_API(idTokenResult, updatedRecord);
            if (res.success) {
                message.success('แก้ไขข้อมูลสำเร็จ');
                setIsEditModalVisible(false);
                fetchData(); // โหลดข้อมูลใหม่
            } else {
                throw new Error(res.message);
            }
        } catch (error) {
            console.error('Error editing member:', error);
            message.error('ไม่สามารถแก้ไขข้อมูลได้');
        } finally {
            setEditLoading(false);
        }
    }, [editingRecord, form, idTokenResult, fetchData]);

    // ฟังก์ชันสำหรับลบข้อมูล
    const handleDelete = useCallback((record) => {
        Modal.confirm({
            title: 'ยืนยันการลบข้อมูล',
            content: `คุณต้องการลบข้อมูลสมาชิก: ${record.houseNumber} ใช่หรือไม่?`,
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await removeMemberData_API(idTokenResult, record);
                    message.success('ลบข้อมูลสำเร็จ');
                    fetchData(); // โหลดข้อมูลใหม่
                } catch (error) {
                    console.error('Error deleting member:', error);
                    message.error('ไม่สามารถลบข้อมูลได้');
                }
            },
        });
    }, [idTokenResult, fetchData]);

    const handExportMenberdata = useCallback((record) =>{
        exportMemberData(idTokenResult,user).then((res)=>{
            console.log(res)
        }).catch((err)=>{

        })
    })

    return (
        <div className="member-database-container">
            <MenuBar />

            <div className="box-navbar">
                <div
                    className="box-menu"
                    onClick={() => setIsCreateModalVisible(true)}
                >
                    สร้างฐานข้อมูลลูกค้าใหม่
                </div>
                <div
                    className="box-menu"
                    onClick={() => handExportMenberdata()}
                >
                    รายงาน
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        dataSource={dataMembers.map((member) => ({
                            key: member.id,
                            ...member,
                        }))}
                        rowKey="id"
                        pagination={false}
                        expandable={{
                            expandedRowRender: (record) => (
                                <Table
                                    columns={[
                                        { title: 'ประเภทรถ', dataIndex: 'type', key: 'type', align: 'center' },
                                        { title: 'ป้ายทะเบียนรถ', dataIndex: 'licensePlate', key: 'licensePlate', align: 'center' },
                                        { title: 'จังหวัด', dataIndex: 'province', key: 'province', align: 'center' },
                                    ]}
                                    dataSource={record.vehicles.map((vehicle) => ({
                                        ...vehicle,
                                        key: vehicle.id,
                                    }))}
                                    pagination={false}
                                />
                            ),
                        }}
                    >
                        <Column title="บ้านเลขที่" dataIndex="houseNumber" key="houseNumber" align="center" />
                        <Column title="สถานะ" dataIndex="status" key="status" align="center" />
                        <Column title="จำนวนรถ" dataIndex={["vehicles", "length"]} key="numberVehicles" align="center" />
                        <Column
                            title="Action"
                            key="action"
                            align="center"
                            render={(_, record) => (
                                <Space size="middle">
                                    <Button
                                        style={{ backgroundColor: 'yellow', borderColor: 'yellow' }}
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(record)}
                                    >
                                    </Button>

                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(record)}
                                    />
                                </Space>
                            )}
                        />
                    </Table>
                )}
            </div>

            {/* Modal สำหรับสร้างข้อมูล */}
            <Modal
                title="สร้างฐานข้อมูลลูกค้าใหม่"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <CreateMemberData
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateModalVisible(false)}
                />
            </Modal>

            {/* Modal สำหรับแก้ไขข้อมูล */}
            <Modal
                title="แก้ไขข้อมูลสมาชิก"
                open={isEditModalVisible}
                onOk={handleEditConfirm}
                onCancel={() => setIsEditModalVisible(false)}
                confirmLoading={editLoading}
                okText="บันทึก"
                cancelText="ยกเลิก"
                width="700px"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="houseNumber"
                        label="บ้านเลขที่"
                        rules={[{ required: true, message: 'กรุณากรอกบ้านเลขที่!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="สถานะ"
                        rules={[{ required: true, message: 'กรุณาเลือกสถานะ!' }]}
                    >
                        <Select>
                            <Option value="เจ้าของ">เจ้าของ</Option>
                            <Option value="คนเช่า">คนเช่า</Option>
                        </Select>
                    </Form.Item>
                    <Form.List name="vehicles">
                        {(fields, { add, remove }) => (
                            <>
                                <div>ข้อมูลรถ</div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'vehicleType']}
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
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'licensePlate']}
                                            rules={[{ required: true, message: 'กรุณากรอกป้ายทะเบียน!' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'province']}
                                            rules={[{ required: true, message: 'กรุณากรอกจังหวัด!' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Button type="link" danger onClick={() => remove(name)}>
                                            ลบ
                                        </Button>
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                    เพิ่มรถใหม่
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default MemberDataBase;
