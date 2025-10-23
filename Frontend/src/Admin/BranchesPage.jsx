import React, { useState, useEffect } from 'react';
import { Card, Table, message, Input, Button, Modal } from 'antd';
import { ShopOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchBranches, getAllUsers, addBranch } from '../utils/api';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchUsers, setBranchUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAddBranchModalVisible, setIsAddBranchModalVisible] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesData, usersData] = await Promise.all([
        fetchBranches(),
        getAllUsers()
      ]);
  
      let branchNames = [];
  
      if (branchesData && Array.isArray(branchesData.branches)) {
        branchNames = branchesData.branches.map((name, index) => ({
          _id: `branch_${index + 1}`,
          name: String(name).trim()
        }));
      }
  
      setBranches(branchNames);
      setUsers(usersData);
  
      calculateBranchStats(branchNames, usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBranchStats = (branches, allUsers) => {
    const branchMap = {};
  
    const usersArray = Array.isArray(allUsers) ? allUsers : [];
  
    if (Array.isArray(branches)) {
      branches.forEach(branch => {
        if (branch && branch._id) {
          branchMap[branch.name] = {
            _id: branch._id,
            name: branch.name || 'Unnamed Branch',
            users: [],
            activeUsers: 0,
            totalRevenue: 0
          };
        }
      });
    }
  
    usersArray.forEach(user => {
      if (!user || !user.branch) return;
  
      const branch = branchMap[user.branch];
      if (!branch) return;
  
      branch.users.push(user);
  
      const status = (user.accountStatus || '').toLowerCase();
      if (status !== 'suspended' && status !== 'terminated') {
        branch.activeUsers++;
      }
  
      const amount = Number(user.orderAmount || user.planAmount || 0);
      branch.totalRevenue += isNaN(amount) ? 0 : amount;
    });
  
    const stats = Object.values(branchMap).map(branch => ({
      ...branch,
      key: branch._id,
      totalUsers: branch.users.length,
      totalRevenue: branch.totalRevenue || 0
    }));
  
    setBranchStats(stats);
  };

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setBranchUsers(branch.users);
  };

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) {
      message.warning('Please enter a branch name');
      return;
    }

    try {
      setIsAddingBranch(true);
      await addBranch({ name: newBranchName.trim() });
      message.success('Branch added successfully');
      setNewBranchName('');
      setIsAddBranchModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Error adding branch:', error);
      message.error('Failed to add branch');
    } finally {
      setIsAddingBranch(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        {!selectedBranch ? (
          // Branch overview
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShopOutlined className="text-3xl text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
              </div>
              <button
                onClick={() => setIsAddBranchModalVisible(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusOutlined />
                <span>Add Branch</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branchStats.length > 0 ? (
                branchStats.map((branch) => (
                  <Card
                    key={branch._id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-xl bg-white"
                    onClick={() => handleBranchClick(branch)}
                    styles={{ body: { padding: '24px' } }}
                  >
                    <div className="text-center space-y-4">
                      <div className="text-4xl p-4 bg-blue-50 text-blue-600 rounded-full mx-auto w-fit">
                        <ShopOutlined />
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {branch.name}
                        </h4>
                        <div className="space-y-1 text-gray-600">
                          <p className="text-sm">Total Users: <span className="font-semibold text-gray-800">{branch.totalUsers}</span></p>
                          <p className="text-sm">Active: <span className="font-semibold text-green-600">{branch.activeUsers}</span></p>
                          <p className="text-sm">Revenue: <span className="font-semibold text-blue-600">₹{branch.totalRevenue.toLocaleString()}</span></p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-20">
                  <ShopOutlined className="text-8xl text-gray-300 mb-4" />
                  <p className="text-gray-500 text-xl">No branch data available</p>
                  <p className="text-sm text-gray-400 mt-2">Add branches to get started</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Branch users detail
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedBranch(null);
                    setBranchUsers([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Back to branches"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBranch.name}</h2>
                  <p className="text-gray-600">{selectedBranch.totalUsers} total users, {selectedBranch.activeUsers} active</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{selectedBranch.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  y: 500
                }}
                className="[&_.ant-table]:bg-white [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr>td]:text-gray-700 [&_.ant-table-tbody>tr:hover>td]:bg-gray-50"
              />
            </div>
          </div>
        )}
        
        <Modal
          title="Add New Branch"
          open={isAddBranchModalVisible}
          onCancel={() => setIsAddBranchModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsAddBranchModalVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleAddBranch}
              loading={isAddingBranch}
            >
              Add Branch
            </Button>,
          ]}
        >
          <div className="py-4">
            <Input
              placeholder="Enter branch name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onPressEnter={handleAddBranch}
              autoFocus
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BranchesPage;
