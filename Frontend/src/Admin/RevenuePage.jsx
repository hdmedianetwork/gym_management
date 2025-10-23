import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Table, Statistic, DatePicker, Spin, message, Select } from 'antd';
import { MoneyCollectOutlined, RiseOutlined, CalendarOutlined } from '@ant-design/icons';
import { getSuccessfulPayments } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const RevenuePage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [filterType, setFilterType] = useState('all');

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSuccessfulPayments();
      
      if (response.success && response.transactions) {
        const paymentsData = response.transactions
          .filter(transaction => {
            const orderStatus = transaction.orderStatus?.toLowerCase();
            return orderStatus === 'paid' || orderStatus === 'success';
          })
          .map(payment => ({
            ...payment,
            paymentDate: payment.createdAt || payment.paymentCompletedAt
          }));
          
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Calculate filtered payments and statistics
  const { filteredPayments, totalRevenue, monthlyRevenue, todayRevenue } = useMemo(() => {
    let filtered = [...payments];
    const now = dayjs();
    const startOfMonth = now.startOf('month');
    const startOfDay = now.startOf('day');

    // Apply date range filter
    if (dateRange.length === 2) {
      filtered = filtered.filter(payment => {
        const paymentDate = dayjs(payment.paymentDate);
        return paymentDate.isAfter(dateRange[0]) && paymentDate.isBefore(dateRange[1]);
      });
    }

    // Apply payment type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(payment => {
        const amount = payment.orderAmount || 0;
        if (filterType === 'high') return amount >= 5000;
        if (filterType === 'medium') return amount >= 2000 && amount < 5000;
        if (filterType === 'low') return amount < 2000;
        return true;
      });
    }

    // Calculate statistics
    const total = filtered.reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    
    const monthly = payments
      .filter(payment => dayjs(payment.paymentDate).isAfter(startOfMonth))
      .reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);
    
    const today = payments
      .filter(payment => dayjs(payment.paymentDate).isAfter(startOfDay))
      .reduce((sum, payment) => sum + (payment.orderAmount || 0), 0);

    return {
      filteredPayments: filtered,
      totalRevenue: total,
      monthlyRevenue: monthly,
      todayRevenue: today
    };
  }, [payments, dateRange, filterType]);

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || []);
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

  const paymentColumns = useMemo(() => [
    {
      title: 'Date & Time',
      key: 'date',
      width: 180,
      render: (_, record) => {
        const date = dayjs(record.paymentDate);
        return (
          <div>
            <div className="font-medium text-gray-900">
              {date.format('DD MMM YYYY')}
            </div>
            <div className="text-sm text-gray-600">
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
          <div className="text-sm text-gray-600">
            {record.customerDetails?.customer_email || 
             record.customerDetails?.customerEmail || 
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
          <div className="text-xs text-gray-600">
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
        <div className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
          {orderId || 'N/A'}
        </div>
      ),
    }
  ], []);

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Revenue Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <Statistic
            title="Total Revenue"
            value={totalRevenue}
            prefix="₹"
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Monthly Revenue"
            value={monthlyRevenue}
            prefix="₹"
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Today's Revenue"
            value={todayRevenue}
            prefix="₹"
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <RangePicker
              className="w-full"
              onChange={handleDateRangeChange}
              value={dateRange}
              placeholder={['Start Date', 'End Date']}
            />
          </div>
          <Select
            className="w-full md:w-48"
            value={filterType}
            onChange={setFilterType}
            placeholder="Filter by amount"
          >
            <Option value="all">All Payments</Option>
            <Option value="high">High (₹5000+)</Option>
            <Option value="medium">Medium (₹2000-5000)</Option>
            <Option value="low">Low (Under ₹2000)</Option>
          </Select>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Clear Filters
          </button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card
        title="Payment Transactions"
        loading={loading}
      >
        <Table
          columns={paymentColumns}
          dataSource={filteredPayments}
          rowKey="orderId"
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default RevenuePage;
