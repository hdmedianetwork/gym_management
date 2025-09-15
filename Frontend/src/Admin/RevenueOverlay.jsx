import React, { useState, useEffect } from 'react';
import { Modal, Card, Table, Statistic, DatePicker, Select, Spin } from 'antd';
import { MoneyCollectOutlined, RiseOutlined, UserOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { getSuccessfulPayments } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const RevenueOverlay = ({ visible, onClose, users = [] }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    if (visible) {
      fetchPayments();
    }
  }, [visible]);

  useEffect(() => {
    filterPayments();
  }, [payments, dateRange, filterType]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getSuccessfulPayments();
      
      let paymentsData = [];
      if (response.success && response.transactions) {
        paymentsData = response.transactions.filter(transaction => {
          const orderStatus = transaction.orderStatus?.toLowerCase();
          return orderStatus === 'paid' || orderStatus === 'success';
        });
      }
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];
    const now = dayjs();
    const startOfMonth = now.startOf('month');
    const startOfDay = now.startOf('day');

    // Apply date range filter
    if (dateRange.length === 2) {
      filtered = filtered.filter(payment => {
        const paymentDate = dayjs(payment.createdAt || payment.paymentCompletedAt);
        return paymentDate.isAfter(dateRange[0]) && paymentDate.isBefore(dateRange[1]);
      });
    }

    // Apply payment type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(payment => {
        if (filterType === 'high') return payment.orderAmount >= 5000;
        if (filterType === 'medium') return payment.orderAmount >= 2000 && payment.orderAmount < 5000;
        if (filterType === 'low') return payment.orderAmount < 2000;
        return true;
      });
    }

    setFilteredPayments(filtered);

    // Calculate statistics
    const total = filtered.reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    setTotalRevenue(total);

    // Monthly revenue
    const monthlyPayments = payments.filter(payment => {
      const paymentDate = dayjs(payment.createdAt || payment.paymentCompletedAt);
      return paymentDate.isAfter(startOfMonth);
    });
    const monthly = monthlyPayments.reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    setMonthlyRevenue(monthly);

    // Today's revenue
    const todayPayments = payments.filter(payment => {
      const paymentDate = dayjs(payment.createdAt || payment.paymentCompletedAt);
      return paymentDate.isAfter(startOfDay);
    });
    const today = todayPayments.reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    setTodayRevenue(today);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || []);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
  };

  const clearFilters = () => {
    setDateRange([]);
    setFilterType('all');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const paymentColumns = [
    {
      title: 'Date & Time',
      key: 'date',
      width: 180,
      render: (_, record) => {
        const date = dayjs(record.createdAt || record.paymentCompletedAt);
        return (
          <div>
            <div className="font-medium text-gray-900">
              {date.format('DD MMM YYYY')}
            </div>
            <div className="text-sm text-gray-500">
              {date.format('hh:mm A')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {record.customerDetails?.customer_name || 
             record.customerDetails?.customerName || 
             'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {record.customerDetails?.customer_email || 
             record.customerDetails?.customerEmail || 
             'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {record.customerDetails?.customer_phone || 
             record.customerDetails?.customerPhone || 
             'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      render: (_, record) => (
        <div className="text-right">
          <div className="font-bold text-lg text-green-600">
            {formatCurrency(record.orderAmount || 0)}
          </div>
          <div className="text-xs text-gray-500">
            {record.orderCurrency || 'INR'}
          </div>
        </div>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 140,
      render: (orderId) => (
        <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
          {orderId || 'N/A'}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {record.orderStatus || record.paymentStatus || 'Paid'}
          </span>
        </div>
      ),
    },
  ];

  const getRevenueGrowth = () => {
    const lastMonth = dayjs().subtract(1, 'month');
    const lastMonthStart = lastMonth.startOf('month');
    const lastMonthEnd = lastMonth.endOf('month');
    
    const lastMonthPayments = payments.filter(payment => {
      const paymentDate = dayjs(payment.createdAt || payment.paymentCompletedAt);
      return paymentDate.isAfter(lastMonthStart) && paymentDate.isBefore(lastMonthEnd);
    });
    
    const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    
    if (lastMonthRevenue === 0) return 0;
    return ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <MoneyCollectOutlined className="text-green-600" />
          <span className="text-xl font-semibold text-gray-900">
            Revenue Dashboard
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-0"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Revenue Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="text-center border border-gray-200 rounded-lg shadow-sm">
                <Statistic
                  title="Total Revenue"
                  value={totalRevenue}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<DollarOutlined className="text-green-500" />}
                  valueStyle={{ color: '#16a34a', fontSize: '1.5rem', fontWeight: 'bold' }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {filteredPayments.length} transactions
                </div>
              </Card>

              <Card className="text-center border border-gray-200 rounded-lg shadow-sm">
                <Statistic
                  title="This Month"
                  value={monthlyRevenue}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<RiseOutlined className="text-blue-500" />}
                  valueStyle={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 'bold' }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {getRevenueGrowth() >= 0 ? '+' : ''}{getRevenueGrowth()}% from last month
                </div>
              </Card>

              <Card className="text-center border border-gray-200 rounded-lg shadow-sm">
                <Statistic
                  title="Today"
                  value={todayRevenue}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<CalendarOutlined className="text-orange-500" />}
                  valueStyle={{ color: '#ea580c', fontSize: '1.5rem', fontWeight: 'bold' }}
                />
              </Card>

              <Card className="text-center border border-gray-200 rounded-lg shadow-sm">
                <Statistic
                  title="Average Transaction"
                  value={filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0}
                  formatter={(value) => formatCurrency(value)}
                  prefix={<UserOutlined className="text-purple-500" />}
                  valueStyle={{ color: '#7c3aed', fontSize: '1.5rem', fontWeight: 'bold' }}
                />
              </Card>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    format="DD/MM/YYYY"
                    className="w-64"
                  />
                </div>
                
                
                {(dateRange.length > 0 || filterType !== 'all') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      &nbsp;
                    </label>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white border border-gray-300 rounded-md transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment History
                  {filteredPayments.length !== payments.length && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Filtered: {filteredPayments.length} of {payments.length})
                    </span>
                  )}
                </h3>
              </div>
              
              <Table
                columns={paymentColumns}
                dataSource={filteredPayments}
                rowKey={(record) => record.orderId || record._id}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} payments`,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                scroll={{ x: 'max-content', y: 400 }}
                className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-600 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr>td]:text-gray-700"
                size="small"
              />
            </div>

            {/* Summary Section */}
            {filteredPayments.length === 0 && !loading && (
              <div className="text-center py-12">
                <MoneyCollectOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No payment data available</p>
                <p className="text-gray-400 text-sm mt-2">
                  {dateRange.length > 0 || filterType !== 'all' 
                    ? 'Try adjusting your filters to see more results'
                    : 'Payments will appear here once transactions are made'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RevenueOverlay;