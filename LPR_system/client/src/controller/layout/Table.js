import React from 'react';
import { Space, Table, Tag, Button } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import './styles/ListTable.css';

const { Column } = Table;

const data = [
  {
    key: '1',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: [ 'ตอบรับ'],
  },
  {
    key: '2',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['ไม่ตอบรับ'],
  },
  {
    key: '3',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['ตอบรับ'],
  },
  {
    key: '4',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['ตอบรับ'],
  },
  {
    key: '5',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['ไม่ตอบรับ'],
  },
  {
    key: '6',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['มีสิทธิ์เข้าออก'],
  },
  {
    key: '7',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['มีสิทธิ์เข้าออก'],
  },
  {
    key: '8',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['มีสิทธิ์เข้าออก'],
  },
  {
    key: '9',
    firstName: '-',
    lastName: '-',
    age: "-",
    address: '-',
    tags: ['มีสิทธิ์เข้าออก'],
  },

];

const ListTable = () => (
  <div className="table-container">
    <Table
      className="list-table"
      dataSource={data}
      pagination={false}
      scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
    >
      <Column title="เวลา" dataIndex="firstName" key="firstName" width={100} />
      <Column title="เลขทะเบียน" dataIndex="lastName" key="lastName" width={100} />
      <Column title="ที่อยู่" dataIndex="address" key="address" width={100} />

      <Column
        title="สถานะ"
        dataIndex="tags"
        key="tags"
        render={(tags) => (
          <>
            {tags.map((tag) => {
              let color = 'default';
              if (tag === 'Member') {
                color = 'green';
              } else if (tag === 'ตอบรับ') {
                color = 'green';
              } else if (tag === 'ไม่ตอบรับ') {
                color = 'yellow';
              } else if (tag === 'loser') {
                color = 'red';
              }

              return (
                <Tag color={color} key={tag} className="custom-tag">
                  {tag.toUpperCase()}
                </Tag>
              );
            })}
          </>
        )}
      />

      <Column
        title="เเก้ไข"
        key="action"
        width={100}
        render={(_, record) => (
          <Space size="middle">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              className="action-button edit-button"
              onClick={() => {
                console.log('Edit:', record.key);
              }}
            />
            <Button
              type="primary"
              shape="circle"
              icon={<DeleteOutlined />}
              size="small"
              className="action-button delete-button"
              onClick={() => {
                console.log('Delete:', record.key);
              }}
            />
          </Space>
        )}
      />
    </Table>
  </div>
);

export default ListTable;
