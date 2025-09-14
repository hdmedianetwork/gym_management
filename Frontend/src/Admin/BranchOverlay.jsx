import React, { useState, useEffect } from 'react';
import { Modal, Card, Table } from 'antd';
import { ShopOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';

const BranchOverlay = ({ visible, onClose, users = [] }) => {
  const [branchStats, setBranchStats] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchUsers, setBranchUsers] = useState([]);

  useEffect(() => {
    if (visible && users.length > 0) {
      calculateBranchStats();
    }
  }, [visible, users]);

  const calculateBranchStats = () => {
    // Group users by branch
    const branchMap = {};
    
    users.forEach(user => {
      const branch = user.branch || 'No Branch';
      if (!branchMap[branch]) {
        branchMap[branch] = {
          name: branch,
          users: [],
          activeUsers: 0,
          totalRevenue: 0
        };
      }
      
      branchMap[branch].users.push(user);
      
      // Count active users (not suspended or terminated)
      const status = (user.accountStatus || '').toLowerCase();
      if (status !== 'suspended' && status !== 'terminated') {
        branchMap[branch].activeUsers++;
      }
      
      // Calculate revenue
      const amount = user.orderAmount || user.planAmount || 0;
      branchMap[branch].totalRevenue += amount;
    });

    const stats = Object.values(branchMap).map((branch, index) => ({
      key: index,
      ...branch,
      totalUsers: branch.users.length
    }));

    setBranchStats(stats);
  };

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setBranchUsers(branch.users);
  };

  const userColumns = [
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      width: 150
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email',
      width: 200
    },
    { 
      title: 'Phone', 
      dataIndex: 'mobile', 
      key: 'mobile',
      width: 120,
      render: (mobile, record) => record.mobile || record.phone || 'N/A'
    },
    { 
      title: 'Status', 
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = (record.accountStatus || '').toLowerCase();
        let colorClass = 'bg-gray-100 text-gray-800';
        if (status === 'active') colorClass = 'bg-green-100 text-green-800';
        else if (status === 'suspended') colorClass = 'bg-red-100 text-red-800';
        else if (status === 'terminated') colorClass = 'bg-gray-100 text-gray-600';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1) || 'Unknown'}
          </span>
        );
      }
    },
    { 
      title: 'Amount Paid', 
      key: 'amount',
      width: 120,
      render: (_, record) => {
        const amount = record.orderAmount || record.planAmount || 0;
        return <span className="font-medium">₹{amount.toLocaleString()}</span>;
      }
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <ShopOutlined className="text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">
            {selectedBranch ? `${selectedBranch.name} - Users` : 'Branch Overview'}
          </span>
        </div>
      }
      open={visible}
      onCancel={() => {
        setSelectedBranch(null);
        setBranchUsers([]);
        onClose();
      }}
      footer={null}
      width={selectedBranch ? 900 : 800}
      className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
    >
      {!selectedBranch ? (
        // Branch overview
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Branch Statistics</h3>
            <p className="text-gray-600">Click on any branch to view detailed user information</p>
            {branchStats.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                Total: {branchStats.reduce((acc, branch) => acc + branch.totalUsers, 0)} users across {branchStats.length} branches
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchStats.map((branch, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-lg"
                onClick={() => handleBranchClick(branch)}
                styles={{ body: { padding: '20px' } }}
              >
                <div className="text-center space-y-3">
                  <div className="text-3xl p-3 bg-blue-50 text-blue-500 rounded-full mx-auto w-fit">
                    <ShopOutlined />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {branch.name}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Users:</span>
                        <span className="font-semibold text-gray-900">{branch.totalUsers}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Users:</span>
                        <span className="font-semibold text-green-600">{branch.activeUsers}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold text-blue-600">₹{branch.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {branchStats.length === 0 && (
            <div className="text-center py-12">
              <ShopOutlined className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No branch data available</p>
            </div>
          )}
        </div>
      ) : (
        // Branch users detail
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedBranch(null);
                  setBranchUsers([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to branches"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedBranch.name}</h3>
                <p className="text-gray-600">{selectedBranch.totalUsers} total users, {selectedBranch.activeUsers} active</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-blue-600">₹{selectedBranch.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              dataSource={branchUsers}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} users`
              }}
              scroll={{ 
                x: 'max-content',
                y: 400
              }}
              className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-600 [&_.ant-table-tbody>tr>td]:text-gray-700"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BranchOverlay;