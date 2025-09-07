import React, { useMemo, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, DatePicker, notification } from 'antd';
import { updateUserDetails } from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const EditUserModal = ({ visible, user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

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
    dateOfBirth: user?.dateOfBirth ? dayjs(user.dateOfBirth) : null,
    height: user?.height || '',
    weight: user?.weight || '',
    branch: user?.branch || '',
    address: user?.address || '',
  }), [user]);

  const handleOk = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        mobile: values.mobile?.trim(),
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
        height: values.height ? parseFloat(values.height) : null,
        weight: values.weight ? parseFloat(values.weight) : null,
        branch: values.branch?.trim() || null,
        address: values.address?.trim() || null,
      };
      if (isManual) {
        payload.accountStatus = values.accountStatus;
        payload.paymentStatus = values.paymentStatus;
        payload.planAmount = values.planAmount;
      }
      const res = await updateUserDetails(user._id, payload);
      if (res.success) {
        api.success({
          message: 'Success',
          description: 'User details updated successfully!',
          placement: 'topRight',
          duration: 2,
        });
        onSuccess && onSuccess(res.user);
      } else {
        throw new Error(res.error || 'Failed to update user');
      }
    } catch (err) {
      if (err?.errorFields) return; // antd validation error
      api.error({
        message: 'Update Failed',
        description: err.message || 'Failed to update user details',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
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
      {contextHolder}
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item label="Mobile" name="mobile" rules={[{ required: true, message: 'Please enter mobile number' }]}>
          <Input placeholder="10-digit mobile" />
        </Form.Item>

        <Form.Item label="Date of Birth" name="dateOfBirth">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Height (cm)" name="height">
            <InputNumber className="w-full" min={0} step={0.1} />
          </Form.Item>
          
          <Form.Item label="Weight (kg)" name="weight">
            <InputNumber className="w-full" min={0} step={0.1} />
          </Form.Item>
        </div>

        <Form.Item label="Branch" name="branch">
          <Select placeholder="Select branch">
            <Option value="Mansarover">Mansarover</Option>
            <Option value="Sitapura">Sitapura</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={3} placeholder="Full address" />
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
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={handleOk}
            loading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
