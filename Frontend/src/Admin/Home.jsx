import React, { useState } from 'react';
import { Card, Table, Modal } from 'antd';
import { UserOutlined, ClockCircleOutlined, StopOutlined, CloseOutlined } from '@ant-design/icons';

// Mock data for demonstration
const usersData = {
  active: [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', joinDate: '2023-01-15', endDate: '2023-12-31', planType: 'Premium', paymentStatus: 'Paid' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '234-567-8901', joinDate: '2023-02-20', endDate: '2023-11-30', planType: 'Basic', paymentStatus: 'Expiring' },
  ],
  expiring: [
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '345-678-9012', joinDate: '2022-11-10', endDate: '2023-09-30', planType: 'Premium', paymentStatus: 'Paid' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '456-789-0123', joinDate: '2023-01-05', endDate: '2023-10-01', planType: 'Standard', paymentStatus: 'Expiring' },
  ],
  suspended: [
    { id: 5, name: 'David Brown', email: 'david@example.com', phone: '567-890-1234', endDate: '2023-08-20', planType: 'Basic', paymentStatus: 'suspended' },
    { id: 6, name: 'Emma Davis', email: 'emma@example.com', phone: '678-901-2345', endDate: '2023-08-15', planType: 'Premium', paymentStatus: 'suspended' },
  ]
};
const columns = {
  active: [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Account Status', 
      key: 'status',
      render: (_, record) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          record.paymentStatus === 'active' ? 'bg-green-100 text-green-800' :
          record.paymentStatus === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {record.paymentStatus.charAt(0).toUpperCase() + record.paymentStatus.slice(1)}
        </span>
      )
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Plan Type', dataIndex: 'planType', key: 'planType' },
    { 
      title: 'Payment Status', 
      dataIndex: 'paymentStatus', 
      key: 'paymentStatus',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'Paid' ? 'bg-green-100 text-green-800' :
          status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'Overdue' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
  ],
  expiring: [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Plan Type', dataIndex: 'planType', key: 'planType' },
    { 
      title: 'Payment Status', 
      dataIndex: 'paymentStatus', 
      key: 'paymentStatus',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'Paid' ? 'bg-green-100 text-green-800' :
          status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'Overdue' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
  ],
  suspended: [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Plan Type', dataIndex: 'planType', key: 'planType' },
    { 
      title: 'Payment Status', 
      dataIndex: 'paymentStatus', 
      key: 'paymentStatus',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          status === 'Paid' ? 'bg-green-100 text-green-800' :
          status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'Overdue' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
  ]
};

const Home = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [tableData, setTableData] = useState(usersData.active);
  const [filteredData, setFilteredData] = useState(usersData.active);
  const [tableColumns, setTableColumns] = useState(columns.active);
  const [tableTitle, setTableTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(tableData);
      return;
    }
    const filtered = tableData.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  const handleCardClick = (type) => {
    setActiveTab(type);
    setTableData(usersData[type]);
    setFilteredData(usersData[type]);
    setTableColumns(columns[type]);
    setSearchText('');
    setTableTitle(
      type === 'active' ? '' : 
      type === 'expiring' ? 'Expiring Users (Next 10 Days)' : 
      'Suspended Users'
    );
  };

  const handleRowClick = (record) => {
    setSelectedUser(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  const handleAddMember = () => {
    // Add your add member logic here
    console.log('Add member clicked');
  };

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 sm:mb-8 text-white">Dashboard</h1>
      
      {/* Mobile View - Tabs */}
      <div className="md:hidden mb-6 bg-white rounded-lg shadow-sm p-1">
        <div className="flex justify-between">
          <button
            onClick={() => handleCardClick('active')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active' 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <UserOutlined className="text-lg mb-1" />
              <span>All</span>
              <span className="font-bold text-gray-900">{usersData.active.length}</span>
            </div>
          </button>
          
          <button
            onClick={() => handleCardClick('expiring')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium rounded-md transition-colors ${
              activeTab === 'expiring' 
                ? 'bg-orange-50 text-orange-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <ClockCircleOutlined className="text-lg mb-1" />
              <span>Expiring</span>
              <span className="font-bold text-gray-900">{usersData.expiring.length}</span>
            </div>
          </button>
          
          <button
            onClick={() => handleCardClick('suspended')}
            className={`flex-1 py-3 px-2 text-center text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suspended' 
                ? 'bg-red-50 text-red-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <StopOutlined className="text-lg mb-1" />
              <span>Suspended</span>
              <span className="font-bold text-gray-900">{usersData.suspended.length}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Desktop View - Cards */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <Card 
          className={`cursor-pointer transition-all duration-300 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 ${activeTab === 'active' ? 'ring-2 ring-blue-500 ring-offset-2' : 'border border-gray-200'}`}
          onClick={() => handleCardClick('active')}
          styles={{ body: { padding: '20px' } }}
        >
          <div className="flex items-center gap-5">
            <div className="text-3xl p-3 bg-blue-50 text-blue-500 rounded-full">
              <UserOutlined />
            </div>
            <div>
              <h3 className="text-gray-700 font-medium">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{usersData.active.length}</p>
            </div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-300 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 ${activeTab === 'expiring' ? 'ring-2 ring-orange-500 ring-offset-2' : 'border border-gray-200'}`}
          onClick={() => handleCardClick('expiring')}
          styles={{ body: { padding: '20px' } }}
        >
          <div className="flex items-center gap-5">
            <div className="text-3xl p-3 bg-orange-50 text-orange-500 rounded-full">
              <ClockCircleOutlined />
            </div>
            <div>
              <h3 className="text-gray-700 font-medium">Expiring Soon (10 days)</h3>
              <p className="text-2xl font-bold text-gray-900">{usersData.expiring.length}</p>
            </div>
          </div>
        </Card>

        <div className="relative">
          <div className="absolute -top-8 sm:-top-20 right-0">
            <button
              onClick={() => console.log('Terminated Users clicked')}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:underline font-medium whitespace-nowrap"
            >
              Terminated Users
            </button>
          </div>
          <Card 
            className={`cursor-pointer transition-all duration-300 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 ${activeTab === 'suspended' ? 'ring-2 ring-red-500 ring-offset-2' : 'border border-gray-200'}`}
            onClick={() => handleCardClick('suspended')}
            styles={{ body: { padding: '20px' } }}
          >
            <div className="flex items-center gap-5">
              <div className="text-3xl p-3 bg-red-50 text-red-500 rounded-full">
                <StopOutlined />
              </div>
              <div>
                <h3 className="text-gray-700 font-medium">Suspended Users</h3>
                <p className="text-2xl font-bold text-gray-900">{usersData.suspended.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {activeTab && (
        <div className="bg-white p-3 rounded-lg shadow-md mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{tableTitle}</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
              <button 
                onClick={handleAddMember}
                className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Add Member"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <Table 
              columns={tableColumns} 
              dataSource={filteredData} 
              rowKey="id"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                className: 'cursor-pointer hover:bg-gray-50'
              })}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className="min-w-full [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-600 [&_.ant-table-tbody>tr>td]:text-gray-700"
              locale={{
                emptyText: searchText ? 'No matching records found' : 'No data'
              }}
            />
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Modal
        title="User Details"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl text-blue-500">
                  <UserOutlined />
                </div>
                <div className="relative">
                  <button 
                    onClick={() => console.log('Edit user:', selectedUser.id)}
                    className="absolute -right-8 top-0 text-gray-400 hover:text-blue-600 p-1 transition-colors"
                    title="Edit Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <DetailItem label="Phone" value={selectedUser.phone} />
              <DetailItem label="Plan Type" value={selectedUser.planType} />
              <DetailItem label="Join Date" value={selectedUser.joinDate || '2023-01-01'} />
              <DetailItem 
                label={activeTab === 'expiring' ? 'Expiry Date' : 'End Date'} 
                value={selectedUser.endDate || '2023-12-31'} 
              />
              <DetailItem 
                label="Payment Status" 
                value={
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedUser.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    selectedUser.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedUser.paymentStatus === 'Expiring' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.paymentStatus}
                  </span>
                } 
              />
              <DetailItem label="Membership ID" value={`MEM-${String(selectedUser.id).padStart(4, '0')}`} />
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
              <div className="flex flex-wrap gap-3 justify-between w-full items-center">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Payment History
                </button>
                <button 
                  onClick={() => {
                    console.log('Terminate user:', selectedUser.id);
                    // Add your termination logic here
                  }}
                  className="p-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-full transition-colors"
                  title="Terminate Account"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Reusable component for detail items in the modal
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-gray-900 font-medium">{value}</p>
  </div>
);

export default Home;