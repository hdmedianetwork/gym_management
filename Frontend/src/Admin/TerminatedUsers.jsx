import React, { useState } from 'react';
import { Table, Button, Tooltip } from 'antd';
import { updateUserStatus } from '../utils/api';

const TerminatedUsers = ({ users = [], onReinstate }) => {
  const [loadingIds, setLoadingIds] = useState(new Set());

  const setLoading = (id, isLoading) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      if (isLoading) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSetInactive = async (user) => {
    if (!user?._id) return;
    if (!confirm(`Set ${user.name || 'this user'} to Inactive?`)) return;
    try {
      setLoading(user._id, true);
      await updateUserStatus(user._id, 'inactive');
      if (typeof onReinstate === 'function') await onReinstate();
    } catch (e) {
      alert(e.message || 'Failed to set user inactive');
    } finally {
      setLoading(user._id, false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Source',
      key: 'source',
      render: (_, record) => {
        const isManual = (record.planType || '').toLowerCase() === 'manual';
        return isManual ? (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Manual</span>
        ) : null;
      }
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Phone',
      dataIndex: 'mobile',
      key: 'mobile',
      render: (mobile, record) => record.mobile || record.phone || 'N/A'
    },
    {
      title: 'Account Status',
      key: 'accountStatus',
      render: (_, record) => {
        const s = (record.accountStatus || '').toLowerCase();
        const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${s === 'terminated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
            {label}
          </span>
        );
      }
    },
    {
      title: 'Terminated On',
      key: 'terminatedOn',
      render: (_, record) => {
        const d = record.updatedAt ? new Date(record.updatedAt) : record.terminatedAt ? new Date(record.terminatedAt) : null;
        return d && !isNaN(d) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      }
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Tooltip title="Set to Inactive">
          <Button
            size="small"
            type="default"
            className="border-gray-300 text-gray-700 hover:text-gray-900"
            loading={loadingIds.has(record._id)}
            onClick={() => handleSetInactive(record)}
          >
            Set Inactive
          </Button>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="rounded-lg border border-gray-200 overflow-x-auto">
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="min-w-full [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-600 [&_.ant-table-tbody>tr>td]:text-gray-700"
        locale={{ emptyText: 'No terminated users' }}
      />
    </div>
  );
};

export default TerminatedUsers;
