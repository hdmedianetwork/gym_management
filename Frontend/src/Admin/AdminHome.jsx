import React, { useState, useEffect } from 'react';
import { getAllUsers, getSuccessfulPayments, syncUsersWithPayments } from '../utils/api';
import { Card, Table, Modal } from 'antd';
import { UserOutlined, ClockCircleOutlined, StopOutlined, CloseOutlined } from '@ant-design/icons';

// Helper to categorize users
const categorizeUsers = (users) => {
  const now = new Date();
  const expiringThreshold = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  const active = [];
  const expiring = [];
  const suspended = [];
  users.forEach(user => {
    // Normalize status fields
    const status = (user.accountStatus || '').toLowerCase();
    const payment = (user.paymentStatus || '').toLowerCase();
    // Expiry logic
    let endDate = user.endDate || user.expiryDate || user.membershipEndDate;
    if (endDate) endDate = new Date(endDate);
    // Suspended
    if (status === 'suspended' || payment === 'suspended') {
      suspended.push(user);
    } else if (endDate && endDate <= expiringThreshold && endDate > now && status !== 'suspended') {
      expiring.push(user);
    } else {
      active.push(user);
    }
  });
  return { active, expiring, suspended };
};
const columns = {
  active: [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Account Status', 
      key: 'status',
      render: (_, record) => {
        const status = (record.accountStatus || '').toLowerCase();
        let colorClass = 'bg-gray-100 text-gray-800';
        if (status === 'active') colorClass = 'bg-green-100 text-green-800';
        else if (status === 'expiring') colorClass = 'bg-yellow-100 text-yellow-800';
        else if (status === 'suspended') colorClass = 'bg-red-100 text-red-800';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1) || 'Unknown'}
          </span>
        );
      }
    },
    { 
      title: 'Phone', 
      dataIndex: 'mobile', 
      key: 'mobile',
      render: (mobile, record) => record.mobile || record.phone || 'N/A'
    },
    { 
      title: 'Amount Paid', 
      key: 'planInfo',
      render: (_, record) => {
        const orderAmount = record.orderAmount || record.planAmount || 0;
        return (
          <span className="font-medium text-gray-900">₹{orderAmount.toLocaleString()}</span>
        );
      }
    },
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
    { 
      title: 'Phone', 
      dataIndex: 'mobile', 
      key: 'mobile',
      render: (mobile, record) => record.mobile || record.phone || 'N/A'
    },
    { 
      title: 'Amount Paid', 
      key: 'planInfo',
      render: (_, record) => {
        const orderAmount = record.orderAmount || record.planAmount || 0;
        return (
          <span className="font-medium text-gray-900">₹{orderAmount.toLocaleString()}</span>
        );
      }
    },
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
    { 
      title: 'Phone', 
      dataIndex: 'mobile', 
      key: 'mobile',
      render: (mobile, record) => record.mobile || record.phone || 'N/A'
    },
    { 
      title: 'Amount Paid', 
      key: 'planInfo',
      render: (_, record) => {
        const orderAmount = record.orderAmount || record.planAmount || 0;
        return (
          <span className="font-medium text-gray-900">₹{orderAmount.toLocaleString()}</span>
        );
      }
    },
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
  const [usersData, setUsersData] = useState({ active: [], expiring: [], suspended: [] });
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tableColumns, setTableColumns] = useState(columns.active);
  const [tableTitle, setTableTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paymentsData, setPaymentsData] = useState([]);

  // Helper function to merge user data with payment data
  const mergeUsersWithPayments = (users, payments) => {
    return users.map(user => {
      // Find payment for this user by email matching
      const userPayment = payments.find(payment => 
        payment.customerDetails?.customer_email?.toLowerCase() === user.email?.toLowerCase()
      );
      
      if (userPayment) {
        return {
          ...user,
          orderAmount: userPayment.orderAmount,
          paymentOrderId: userPayment.orderId,
          paymentStatus: userPayment.orderStatus === 'PAID' || userPayment.orderStatus === 'SUCCESS' ? 'Paid' : user.paymentStatus
        };
      }
      
      return user;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both users and payments
        const [usersRes, paymentsRes] = await Promise.all([
          getAllUsers(),
          getSuccessfulPayments()
        ]);
        
        let users = usersRes.users || [];
        let payments = [];
        
        // Process payments data
        if (paymentsRes.success && paymentsRes.transactions && paymentsRes.transactions.length > 0) {
          // Filter successful payments
          payments = paymentsRes.transactions.filter(transaction => {
            const orderStatus = transaction.orderStatus?.toLowerCase();
            return orderStatus === 'paid' || orderStatus === 'success';
          });
          
          setPaymentsData(payments);
          
          // Log payment data for debugging
          console.log('\n' + '='.repeat(60));
          console.log('💰 SUCCESSFUL PAYMENTS DATA');
          console.log('='.repeat(60));
          console.log(`📊 Total Payments in Database: ${paymentsRes.transactions.length}`);
          console.log(`✅ Total Successful Payments: ${payments.length}`);
          console.log(`💸 Total Successful Amount: ₹${paymentsRes.cashfreeSummary?.totalAmount || 0}`);
          
          payments.forEach((payment, index) => {
            console.log(`--- Payment ${index + 1} ---`);
            console.log(`👤 Name: ${payment.customerDetails?.customer_name || 'N/A'}`);
            console.log(`📧 Email: ${payment.customerDetails?.customer_email || 'N/A'}`);
            console.log(`💰 Amount: ₹${payment.orderAmount}`);
            console.log(`✅ Status: ${payment.orderStatus}`);
            console.log('');
          });
          console.log('='.repeat(60));
        }
        
        // Merge users with payment data
        const mergedUsers = mergeUsersWithPayments(users, payments);
        
        console.log('\n🔄 MERGED USER DATA:');
        mergedUsers.forEach(user => {
          if (user.orderAmount) {
            console.log(`👤 ${user.name} (${user.email}): ₹${user.orderAmount}`);
          }
        });
        
        const categorized = categorizeUsers(mergedUsers);
        setUsersData(categorized);
        setTableData(categorized.active);
        setFilteredData(categorized.active);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, []);

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

  const handleSyncUsers = async () => {
    setIsSyncing(true);
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 STARTING USER SYNC WITH PAYMENTS');
      console.log('='.repeat(60));
      
      const syncResult = await syncUsersWithPayments();
      
      if (syncResult.success) {
        console.log('\n✅ Sync completed successfully!');
        console.log(`📊 Total payments processed: ${syncResult.totalPayments}`);
        console.log(`👥 Users updated: ${syncResult.updatedUsers.length}`);
        
        if (syncResult.updatedUsers.length > 0) {
          console.log('\n📋 Updated users:');
          syncResult.updatedUsers.forEach(user => {
            console.log(`👤 ${user.name} (${user.email}): ${user.changes.join(', ')}`);
          });
        } else {
          console.log('ℹ️  No users needed updates');
        }
        
        // Refresh the users data to show updated information
        const res = await getAllUsers();
        const categorized = categorizeUsers(res.users || []);
        setUsersData(categorized);
        
        // Update current table based on active tab
        const currentData = categorized[activeTab] || [];
        setTableData(currentData);
        setFilteredData(currentData);
        
        alert(`Sync completed! ${syncResult.updatedUsers.length} users updated. Check console for details.`);
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      alert('Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
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
                onClick={handleSyncUsers}
                disabled={isSyncing}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                title="Sync Users with Payments"
              >
                {isSyncing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Users
                  </>
                )}
              </button>
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
              rowKey="_id"
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
              <DetailItem label="Amount Paid" value={selectedUser.orderAmount ? `₹${selectedUser.orderAmount.toLocaleString()}` : (selectedUser.planAmount ? `₹${selectedUser.planAmount.toLocaleString()}` : 'N/A')} />
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