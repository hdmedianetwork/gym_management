import React, { useState, useEffect } from 'react';
import { Modal, Card, Table, message, Input, Button } from 'antd';
import { ShopOutlined, UserOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchBranches, getAllUsers, addBranch } from '../utils/api';

const BranchOverlay = ({ visible, onClose }) => {
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
    if (visible) {
      loadData();
    }
  }, [visible]);

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
          _id: `branch_${index + 1}`,  // unique id
          name: String(name).trim()    // branch name
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
          branchMap[branch.name] = {   // ✅ use branch.name as key
            _id: branch._id,
            name: branch.name || 'Unnamed Branch',
            users: [],
            activeUsers: 0,
            totalRevenue: 0
          };
        }
      });
    }
  
    // Assign users to correct branch by name
    usersArray.forEach(user => {
      if (!user || !user.branch) return;
  
      const branch = branchMap[user.branch]; // ✅ matches "Vivek vihar"
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
      loadData(); // Refresh the branch list
    } catch (error) {
      console.error('Error adding branch:', error);
      message.error('Failed to add branch');
    } finally {
      setIsAddingBranch(false);
    }
  };

  const showAddBranchModal = () => {
    setNewBranchName('');
    setIsAddBranchModalVisible(true);
  };

  const handleCancelAddBranch = () => {
    setIsAddBranchModalVisible(false);
    setNewBranchName('');
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedBranch ? (
        // Branch overview
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Branch Statistics</h3>
            <button
              onClick={showAddBranchModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <PlusOutlined />
              <span>Add Branch</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchStats.length > 0 ? (
              branchStats.map((branch) => (
                <Card
                  key={branch._id}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-lg"
                  onClick={() => handleBranchClick(branch)}
                  styles={{ body: { padding: '20px' } }}
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl p-3 bg-blue-50 text-blue-500 rounded-full mx-auto w-fit">
                      <ShopOutlined />
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {branch.name}
                      </h4>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <ShopOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No branch data available</p>
                <p className="text-sm text-gray-400 mt-2">Add branches to get started</p>
              </div>
            )}
          </div>
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
      
      {/* Add Branch Modal */}
      <Modal
        title="Add New Branch"
        open={isAddBranchModalVisible}
        onCancel={handleCancelAddBranch}
        footer={[
          <Button key="cancel" onClick={handleCancelAddBranch}>
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
    </Modal>
  );
};

export default BranchOverlay;