import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button } from 'antd';
import { createUserManually } from '../utils/api';

const { Option } = Select;

const AddUserModal = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        name: values.name,
        email: values.email,
        mobile: values.mobile,
        accountStatus: values.accountStatus,
        planAmount: values.planAmount || 0,
        paymentStatus: values.paymentStatus,
      };
      await createUserManually(payload);
      alert('User created successfully');
      if (typeof onSuccess === 'function') onSuccess();
      form.resetFields();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ accountStatus: 'inactive', paymentStatus: 'unpaid', planAmount: 0 }}
      >
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
          <Input placeholder="email@example.com" />
        </Form.Item>
        <Form.Item label="Mobile Number" name="mobile" rules={[{ required: true, message: 'Please enter mobile number' }]}>
          <Input placeholder="10-digit mobile number" />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item label="Account Status" name="accountStatus" rules={[{ required: true }]}>
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Payment Status" name="paymentStatus" rules={[{ required: true }]}>
            <Select>
              <Option value="paid">Paid</Option>
              <Option value="unpaid">Unpaid</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item label="Amount Paid (₹)" name="planAmount">
          <InputNumber className="w-full" min={0} step={100} placeholder="0" />
        </Form.Item>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Add User
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddUserModal;
