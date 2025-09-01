import React, { useMemo } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button } from 'antd';
import { updateUserDetails } from '../utils/api';

const { Option } = Select;

const EditUserModal = ({ visible, user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  const isManual = useMemo(() => {
    return (user?.planType || '').toLowerCase() === 'manual';
  }, [user]);

  const initialValues = useMemo(() => ({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    accountStatus: (user?.accountStatus || '').toLowerCase() || 'active',
    paymentStatus: (user?.paymentStatus || '').toLowerCase() || 'pending',
    planAmount: user?.planAmount ?? user?.orderAmount ?? 0,
  }), [user]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        mobile: values.mobile?.trim(),
      };
      if (isManual) {
        payload.accountStatus = values.accountStatus;
        payload.paymentStatus = values.paymentStatus;
        payload.planAmount = Number(values.planAmount) || 0;
      }
      const res = await updateUserDetails(user._id, payload);
      if (res.success) {
        onSuccess && onSuccess(res.user);
      } else {
        throw new Error(res.error || 'Failed to update user');
      }
    } catch (err) {
      if (err?.errorFields) return; // antd validation error
      alert(err.message || 'Update failed');
    }
  };

  return (
    <Modal
      open={visible}
      title={`Edit ${user?.name || 'User'}`}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}>
          <Input placeholder="email@example.com" />
        </Form.Item>
        <Form.Item label="Mobile" name="mobile" rules={[{ required: true, message: 'Please enter mobile number' }]}>
          <Input placeholder="10-digit mobile" />
        </Form.Item>

        {isManual && (
          <>
            <Form.Item label="Account Status" name="accountStatus" rules={[{ required: true }]}>
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
                <Option value="terminated">Terminated</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Payment Status" name="paymentStatus" rules={[{ required: true }]}>
              <Select>
                <Option value="paid">Paid</Option>
                <Option value="pending">Pending</Option>
                <Option value="unpaid">Unpaid</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Amount Paid" name="planAmount" rules={[{ type: 'number', min: 0 }]}> 
              <InputNumber className="w-full" prefix="₹" placeholder="0" />
            </Form.Item>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleOk}>Save Changes</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
